"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Pole na heslo s přepínačem „zobrazit/skrýt". Bez něj uživatel nevidí, co má
 * reálně v poli — což byl problém u resetu: prohlížeč tam vecpal staré heslo
 * (i s tečkou na konci), uživatelka to kvůli puntíkům neviděla a nastavila si
 * jiné heslo, než si myslela.
 */
function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [show, setShow] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={show ? "text" : "password"}
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        // tabIndex -1: přepínač nemá krást fokus při procházení formuláře Tabem.
        tabIndex={-1}
        aria-label={show ? "Skrýt heslo" : "Zobrazit heslo"}
        className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export { PasswordInput };
