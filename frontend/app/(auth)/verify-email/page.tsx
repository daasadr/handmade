"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    api.auth.verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <>
      <CardContent className="px-8 pt-4">
        {status === "loading" && (
          <div className="flex items-center justify-center py-8">
            <span className="text-3xl animate-pulse">✦</span>
          </div>
        )}
        {status === "success" && (
          <div className="rounded-xl px-5 py-6 text-center" style={{ background: "oklch(0.65 0.15 155 / 0.10)", border: "1px solid oklch(0.65 0.15 155 / 0.3)" }}>
            <p className="text-3xl mb-3">✦</p>
            <p className="font-medium" style={{ color: "oklch(0.40 0.12 155)" }}>
              E-mail byl úspěšně ověřen!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Nyní se můžete přihlásit.
            </p>
          </div>
        )}
        {status === "error" && (
          <div className="rounded-xl px-5 py-6 text-center" style={{ background: "oklch(0.577 0.245 27.325 / 0.08)", border: "1px solid oklch(0.577 0.245 27.325 / 0.3)" }}>
            <p className="text-3xl mb-3">✦</p>
            <p className="font-medium" style={{ color: "oklch(0.50 0.20 27)" }}>
              Odkaz je neplatný nebo vypršel
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Zkuste se znovu zaregistrovat nebo kontaktujte podporu.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="px-8 pb-8 justify-center">
        <Link href="/login" className="text-sm font-medium hover:underline" style={{ color: "oklch(0.65 0.15 155)" }}>
          Přejít na přihlášení →
        </Link>
      </CardFooter>
    </>
  );
}

export default function VerifyEmailPage() {
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
          Ověření e-mailu
        </CardTitle>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: "linear-gradient(to right, oklch(0.78 0.11 196), oklch(0.65 0.15 155))" }} />
      </CardHeader>
      <Suspense fallback={
        <CardContent className="px-8 pt-4">
          <div className="flex items-center justify-center py-8">
            <span className="text-3xl animate-pulse">✦</span>
          </div>
        </CardContent>
      }>
        <VerifyEmailContent />
      </Suspense>
    </Card>
  );
}
