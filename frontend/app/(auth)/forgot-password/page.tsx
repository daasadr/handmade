"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
    } catch {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md card-mystical shadow-lg border-0" style={{ background: "oklch(0.97 0.008 80)" }}>
      <CardHeader className="pb-2 pt-8 px-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">✦</span>
          <span className="font-heading text-xl tracking-wide" style={{ color: "oklch(0.52 0.04 50)" }}>
            handmade.net
          </span>
        </div>
        <CardTitle className="font-heading text-3xl font-light">
          Obnova hesla
        </CardTitle>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: "linear-gradient(to right, oklch(0.78 0.11 196), oklch(0.65 0.15 155))" }} />
        <CardDescription className="mt-3 text-base">
          Zadejte svůj e-mail a my vám pošleme odkaz pro obnovení hesla.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-8 pt-4">
        {sent ? (
          <div className="rounded-xl px-5 py-4 text-center" style={{ background: "oklch(0.65 0.15 155 / 0.10)", border: "1px solid oklch(0.65 0.15 155 / 0.3)" }}>
            <p className="text-2xl mb-2">✦</p>
            <p className="font-medium text-sm" style={{ color: "oklch(0.40 0.12 155)" }}>
              Pokud účet existuje, odeslali jsme odkaz na {email}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Zkontrolujte i složku spam.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="vas@email.cz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Odesílám…" : "Odeslat odkaz"}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="px-8 pb-8 justify-center">
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="font-medium hover:underline" style={{ color: "oklch(0.65 0.15 155)" }}>
            ← Zpět na přihlášení
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
