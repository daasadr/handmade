"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) {
      toast.error("Hesla se neshodují");
      return;
    }
    if (password.length < 8) {
      toast.error("Heslo musí mít alespoň 8 znaků");
      return;
    }
    if (!token) {
      toast.error("Neplatný odkaz pro obnovu hesla");
      return;
    }
    setLoading(true);
    try {
      await api.auth.resetPassword(token, password);
      toast.success("Heslo bylo změněno. Přihlaste se.");
      router.push("/login");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Odkaz je neplatný nebo vypršel");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <CardContent className="px-8 py-12 text-center">
        <p className="text-3xl mb-3">✦</p>
        <p className="font-medium" style={{ color: "oklch(0.50 0.20 27)" }}>Neplatný odkaz</p>
        <p className="text-sm text-muted-foreground mt-2">Vyžádejte si nový odkaz pro obnovu hesla.</p>
        <Link href="/forgot-password" className="block mt-4 text-sm font-medium hover:underline" style={{ color: "oklch(0.65 0.15 155)" }}>
          Obnovit heslo znovu →
        </Link>
      </CardContent>
    );
  }

  return (
    <>
      <CardContent className="px-8 pt-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="password">Nové heslo</Label>
            <Input
              id="password"
              type="password"
              placeholder="alespoň 8 znaků"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password2">Nové heslo znovu</Label>
            <Input
              id="password2"
              type="password"
              placeholder="••••••••"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Ukládám…" : "Uložit nové heslo"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="px-8 pb-8 justify-center">
        <Link href="/login" className="text-sm font-medium hover:underline" style={{ color: "oklch(0.65 0.15 155)" }}>
          ← Zpět na přihlášení
        </Link>
      </CardFooter>
    </>
  );
}

export default function ResetPasswordPage() {
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
          Nové heslo
        </CardTitle>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: "linear-gradient(to right, oklch(0.78 0.11 196), oklch(0.65 0.15 155))" }} />
        <CardDescription className="mt-3 text-base">
          Zadejte nové heslo pro váš účet.
        </CardDescription>
      </CardHeader>
      <Suspense fallback={
        <CardContent className="px-8 pt-4">
          <div className="flex items-center justify-center py-8">
            <span className="text-3xl animate-pulse">✦</span>
          </div>
        </CardContent>
      }>
        <ResetPasswordContent />
      </Suspense>
    </Card>
  );
}
