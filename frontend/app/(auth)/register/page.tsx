"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    setLoading(true);
    try {
      await api.auth.register(email, password);
      toast.success("Účet vytvořen! Zkontrolujte e-mail pro ověření.");
      router.push("/login");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registrace selhala");
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
          Začněte zdarma
        </CardTitle>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: "linear-gradient(to right, oklch(0.78 0.11 196), oklch(0.65 0.15 155))" }} />
        <CardDescription className="mt-3 text-base">
          5 AI optimalizací měsíčně bez poplatku
        </CardDescription>
      </CardHeader>

      <CardContent className="px-8 pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="password">Heslo</Label>
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
            <Label htmlFor="password2">Heslo znovu</Label>
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
            {loading ? "Vytvářím účet…" : "Vytvořit účet"}
          </Button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" style={{ borderColor: "oklch(0.85 0.02 72)" }} />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 text-muted-foreground" style={{ background: "oklch(0.97 0.008 80)" }}>nebo</span>
          </div>
        </div>

        <a
          href={`${API_URL}/auth/google`}
          className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center gap-2")}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Registrovat se přes Google
        </a>
      </CardContent>

      <CardFooter className="px-8 pb-8 justify-center">
        <p className="text-sm text-muted-foreground">
          Již máte účet?{" "}
          <Link
            href="/login"
            className="font-medium hover:underline"
            style={{ color: "oklch(0.65 0.15 155)" }}
          >
            Přihlaste se
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
