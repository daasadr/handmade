"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { api, AdminUser, AdminStats, UpdateAdminUserData, isVipActive } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const PLANS = ["free", "mini", "midi", "max"] as const;
const PLAN_LABELS: Record<string, string> = { free: "Free", mini: "Mini", midi: "Midi", max: "Max" };

const selectStyle = {
  background: "oklch(0.97 0.008 80)",
  borderColor: "oklch(0.85 0.02 72)",
};

/** Datum pro <input type="date"> — ISO řetězec ze serveru je delší. */
function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
      <CardContent className="py-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-heading text-3xl font-light mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // ID uživatelů, u kterých právě běží uložení — blokuje další změny řádku.
  const [saving, setSaving] = useState<Set<string>>(new Set());

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    Promise.all([api.admin.getUsers(), api.admin.getStats()])
      .then(([u, s]) => {
        setUsers(u);
        setStats(s);
      })
      .catch((err: unknown) =>
        toast.error(err instanceof Error ? err.message : "Načtení dat selhalo"),
      )
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const patchUser = async (id: string, data: UpdateAdminUserData) => {
    // Odebrání vlastní admin role by autora okamžitě vyzamklo z administrace.
    if (id === user?.id && data.role === "maker") {
      const otherAdmins = users.filter((u) => u.role === "admin" && u.id !== id).length;
      const warning = otherAdmins
        ? "Odeberete si vlastní admin roli a ztratíte přístup do administrace. Pokračovat?"
        : "Jste jediný administrátor. Odebráním role ztratí přístup do administrace úplně všichni a půjde to vrátit jen zásahem do databáze. Opravdu pokračovat?";
      if (!confirm(warning)) {
        // Vrátí <select> zpět na původní hodnotu.
        setUsers((prev) => [...prev]);
        return;
      }
    }

    const previous = users;
    // Optimistický update — tabulka zůstane responzivní, při chybě se vrátí zpět.
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } as AdminUser : u)));
    setSaving((prev) => new Set(prev).add(id));

    try {
      const updated = await api.admin.updateUser(id, data);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      if (data.isVip !== undefined) {
        toast.success(data.isVip ? "VIP uděleno" : "VIP odebráno");
      } else {
        toast.success("Uloženo");
      }
      api.admin.getStats().then(setStats).catch(() => {});
    } catch (err: unknown) {
      setUsers(previous);
      toast.error(err instanceof Error ? err.message : "Uložení selhalo");
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="text-3xl animate-pulse">✦</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-heading text-4xl font-light heading-accent">Administrace</h1>
        <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-3xl">✦</p>
            <p className="font-heading text-xl font-light">Sem nemáte přístup</p>
            <p className="text-muted-foreground text-sm">
              Administrace je dostupná pouze účtům s rolí administrátora.
            </p>
            <Link href="/dashboard" className="text-sm hover:underline" style={{ color: "oklch(0.40 0.10 196)" }}>
              ← Zpět na přehled
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const filtered = query ? users.filter((u) => u.email.toLowerCase().includes(query)) : users;

  const planCount = (plan: string) =>
    stats?.planCounts.find((p) => p.plan === plan)?.count ?? "0";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-4xl font-light heading-accent">Administrace</h1>
        <p className="text-muted-foreground mt-3">
          Správa uživatelů, tarifů a VIP účtů.
        </p>
      </div>

      {/* Statistiky */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Uživatelé" value={stats?.totalUsers ?? "—"} />
        <StatCard label="Produkty" value={stats?.totalProducts ?? "—"} />
        <StatCard label="VIP účty" value={stats?.vipCount ?? "—"} />
        <StatCard
          label="Platící"
          value={
            stats
              ? PLANS.filter((p) => p !== "free").reduce((sum, p) => sum + Number(planCount(p)), 0)
              : "—"
          }
        />
      </div>

      {/* Rozpad tarifů */}
      {stats && (
        <div className="flex flex-wrap gap-2">
          {PLANS.map((plan) => (
            <span
              key={plan}
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: "oklch(0.88 0.02 72)", color: "oklch(0.35 0.04 50)" }}
            >
              {PLAN_LABELS[plan]}: <strong>{planCount(plan)}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Uživatelé */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-heading text-2xl font-light">
            Uživatelé{" "}
            <span className="text-base text-muted-foreground">
              ({filtered.length}
              {query && filtered.length !== users.length ? ` z ${users.length}` : ""})
            </span>
          </h2>
          <Input
            placeholder="Hledat podle e-mailu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {filtered.length === 0 ? (
          <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              {query ? `Žádný uživatel neodpovídá „${query}".` : "Zatím tu nejsou žádní uživatelé."}
            </CardContent>
          </Card>
        ) : (
          filtered.map((u) => {
            const busy = saving.has(u.id);
            const vip = isVipActive(u);
            return (
              <Card
                key={u.id}
                className="border-0 card-mystical"
                style={{ background: "oklch(0.94 0.012 75)", opacity: busy ? 0.6 : 1 }}
              >
                <CardContent className="py-4 space-y-3">
                  {/* Hlavička řádku */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{u.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {u.aiUsageThisMonth} optimalizací tento měsíc ·{" "}
                        registrace {new Date(u.createdAt).toLocaleDateString("cs-CZ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {vip && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: "oklch(0.65 0.15 155 / 0.18)",
                            color: "oklch(0.40 0.12 155)",
                          }}
                        >
                          ★ VIP
                        </span>
                      )}
                      {u.isFoundingMember && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: "oklch(0.88 0.10 85 / 0.25)",
                            color: "oklch(0.50 0.14 75)",
                          }}
                        >
                          ✦ Founding
                        </span>
                      )}
                      {u.role === "admin" && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: "oklch(0.78 0.11 196 / 0.18)",
                            color: "oklch(0.35 0.10 196)",
                          }}
                        >
                          Admin
                        </span>
                      )}
                      {!u.emailVerified && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "oklch(0.85 0.02 72)", color: "oklch(0.45 0.04 50)" }}
                          title="E-mail zatím neověřen"
                        >
                          Neověřen
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ovládání */}
                  <div className="flex items-end gap-3 flex-wrap pt-1">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground block">Tarif</label>
                      <select
                        value={u.plan}
                        disabled={busy}
                        onChange={(e) => patchUser(u.id, { plan: e.target.value as AdminUser["plan"] })}
                        className="h-9 rounded-md border px-2 text-sm disabled:opacity-50"
                        style={selectStyle}
                      >
                        {PLANS.map((p) => (
                          <option key={p} value={p}>{PLAN_LABELS[p]}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground block">Role</label>
                      <select
                        value={u.role}
                        disabled={busy}
                        onChange={(e) => patchUser(u.id, { role: e.target.value as AdminUser["role"] })}
                        className="h-9 rounded-md border px-2 text-sm disabled:opacity-50"
                        style={selectStyle}
                      >
                        <option value="maker">Maker</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground block">VIP do (prázdné = napořád)</label>
                      <input
                        type="date"
                        value={toDateInput(u.vipUntil)}
                        disabled={busy || !u.isVip}
                        onChange={(e) =>
                          patchUser(u.id, {
                            vipUntil: e.target.value
                              ? new Date(`${e.target.value}T23:59:59`).toISOString()
                              : null,
                          })
                        }
                        className="h-9 rounded-md border px-2 text-sm disabled:opacity-40"
                        style={selectStyle}
                      />
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => patchUser(u.id, { isVip: !u.isVip })}
                      className="h-9 px-3 rounded-md text-sm font-medium transition-all disabled:opacity-50"
                      style={
                        u.isVip
                          ? { background: "oklch(0.65 0.15 155 / 0.20)", color: "oklch(0.38 0.12 155)" }
                          : { background: "oklch(0.88 0.02 72)", color: "oklch(0.40 0.04 50)" }
                      }
                    >
                      {u.isVip ? "★ Odebrat VIP" : "☆ Udělit VIP"}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => patchUser(u.id, { isFoundingMember: !u.isFoundingMember })}
                      className="h-9 px-3 rounded-md text-sm font-medium transition-all disabled:opacity-50"
                      style={
                        u.isFoundingMember
                          ? { background: "oklch(0.88 0.10 85 / 0.30)", color: "oklch(0.45 0.14 75)" }
                          : { background: "oklch(0.88 0.02 72)", color: "oklch(0.40 0.04 50)" }
                      }
                    >
                      {u.isFoundingMember ? "✦ Odebrat Founding" : "✧ Founding Member"}
                    </button>
                  </div>

                  {/* VIP je nastaven, ale datum už uplynulo */}
                  {u.isVip && !vip && (
                    <p className="text-xs" style={{ color: "oklch(0.55 0.15 40)" }}>
                      VIP vypršelo {new Date(u.vipUntil!).toLocaleDateString("cs-CZ")} — uživatel má znovu
                      limit tarifu {PLAN_LABELS[u.plan]}.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
