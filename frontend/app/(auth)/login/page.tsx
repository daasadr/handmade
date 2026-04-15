"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Přihlášení selhalo");
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
          Vítejte zpět
        </CardTitle>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: "linear-gradient(to right, oklch(0.78 0.11 196), oklch(0.65 0.15 155))" }} />
        <CardDescription className="mt-3 text-base">
          Přihlaste se ke svému účtu
        </CardDescription>
      </CardHeader>

      <CardContent className="px-8 pt-4">
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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Heslo</Label>
              <Link
                href="/forgot-password"
                className="text-xs hover:underline"
                style={{ color: "oklch(0.78 0.11 196)" }}
              >
                Zapomněli jste heslo?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            className="w-full mt-2"
            disabled={loading}
          >
            {loading ? "Přihlašuji…" : "Přihlásit se"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="px-8 pb-8 justify-center">
        <p className="text-sm text-muted-foreground">
          Ještě nemáte účet?{" "}
          <Link
            href="/register"
            className="font-medium hover:underline"
            style={{ color: "oklch(0.65 0.15 155)" }}
          >
            Zaregistrujte se
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
