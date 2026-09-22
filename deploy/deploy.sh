#!/usr/bin/env bash
# Nasazení nové verze Handmade.net na server (VPS).
#
# Spouštěj NA SERVERU z adresáře projektu:
#   /opt/handmade/deploy/deploy.sh
#
# Předpoklad: repozitář je naklonovaný (/opt/handmade), vedle
# docker-compose.prod.yml leží .env s vyplněnými hodnotami a nginx už je
# nakonfigurovaný.
#
# POZOR — migrace: u nás NEjede samostatná služba `migrate` (jako v Prisma
# projektech). TypeORM spouští migrace sám při startu backendu
# (migrationsRun=true v produkci). Kdyby migrace selhala, backend spadne při
# bootu a /api/health nikdy nenaběhne — tenhle skript to pozná a skončí chybou,
# takže nová verze nikdy „tiše" nepojede nad starým schématem.

set -euo pipefail

# Do kořene projektu — skript pak funguje bez ohledu na to, odkud ho spustíš.
cd "$(dirname "$0")/.."

COMPOSE="docker compose -f docker-compose.prod.yml"

if [ ! -f .env ]; then
  echo "Chybí .env. Zkopíruj .env.example do .env a doplň hodnoty." >&2
  exit 1
fi

# Port backendu (na něm žije /api/health). Musí sedět s mapováním v
# docker-compose.prod.yml (127.0.0.1:3001), jinak by kontrola níž ťukala na
# cizí projekt. Když PORT v .env není, padáme na výchozí 3001.
# `|| true` brání set -e ukončit skript, když PORT v .env chybí.
BACKEND_PORT="$(grep -E '^PORT=' .env | cut -d= -f2 | tr -d '[:space:]')" || true
BACKEND_PORT="${BACKEND_PORT:-3001}"

# Zámek, podle kterého (budoucí) hlídač dostupnosti pozná, že nedostupnost
# během nasazení je naše práce, a nemá kvůli ní budit. Uklízí se i při chybě
# a přerušení — zapomenutý zámek by hlídače umlčel natrvalo.
LOCK="/var/tmp/handmade-deploy.lock"
touch "$LOCK"
trap 'rm -f "$LOCK"' EXIT

echo "==> Stahuji změny z gitu"
git pull --ff-only

# ID images NAŠICH služeb PŘED buildem. Po nasazení podle nich smažeme jen
# staré verze tohoto projektu. Proto tu NENÍ žádný globální `docker image
# prune` ani `docker builder prune` — ty nejdou omezit na jeden projekt a
# sáhly by na images ostatních projektů na témže serveru (almostthere,
# skrytokraj, familyfood).
OLD_IMAGES="$($COMPOSE images -q 2>/dev/null | sort -u || true)"

echo "==> Sestavuji images (backend, frontend)"
$COMPOSE build

echo "==> Spouštím novou verzi"
# Postgres má healthcheck a backend na něj čeká (depends_on: service_healthy).
# Backend při startu sám spustí TypeORM migrace a teprve pak začne poslouchat.
$COMPOSE up -d

echo "==> Čekám, až backend naběhne a schéma sedí (/api/health)"
# /api/health sahá i do databáze (SELECT 1) — 200 znamená, že backend
# nastartoval, migrace proběhly a na DB dosáhne. Čekání na obyčejnou stránku
# by ohlásilo „hotovo" i s mrtvou DB a poznal by to až první uživatel.
HEALTHY=0
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${BACKEND_PORT}/api/health"; then
    HEALTHY=1
    break
  fi
  sleep 2
done

if [ "$HEALTHY" -ne 1 ]; then
  echo "Backend do 60 s neodpověděl na /api/health." >&2
  echo "Staré images NECHÁVÁM kvůli případnému rollbacku." >&2
  echo "Zkontroluj logy: $COMPOSE logs --tail=50 backend" >&2
  exit 1
fi

# Úklid děláme až po potvrzeném health checku: kdyby nová verze byla rozbitá,
# staré images tu zůstanou pro rychlý ruční rollback.
echo "==> Uklízím staré images tohoto projektu"
NEW_IMAGES="$($COMPOSE images -q | sort -u)"
for img in $OLD_IMAGES; do
  # Přeskoč image, který je pořád aktuální (od minula se nezměnil, např.
  # postgres:16-alpine, který se nebuilduje).
  if echo "$NEW_IMAGES" | grep -q "^${img}$"; then
    continue
  fi
  # `docker image rm` selže, pokud image ještě běží v kontejneru — proto
  # `|| true`. Smažeme tak jen opravdu odstavené staré verze, nikdy nic
  # potřebného a nikdy nic z jiného projektu.
  docker image rm "$img" >/dev/null 2>&1 || true
done

echo "Hotovo — nová verze běží a /api/health odpovídá."
