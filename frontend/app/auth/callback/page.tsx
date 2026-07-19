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
      // Full page load is intentional: AuthProvider in root layout already
      // ran refresh() with an empty localStorage. A SPA navigation to
      // /dashboard would hit ProtectedLayout with user=null and bounce
      // back to /login. A hard redirect forces root layout to remount so
      // AuthProvider.refresh() picks up the newly saved token.
      window.location.href = "/dashboard";
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
