"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("access_token", token);
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "oklch(0.973 0.008 80)" }}>
      <span className="text-4xl animate-pulse">✦</span>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: "oklch(0.973 0.008 80)" }}>
        <span className="text-4xl animate-pulse">✦</span>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
