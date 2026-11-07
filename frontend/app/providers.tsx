"use client";

import { AuthProvider } from "@/lib/auth-context";
import { LocaleProvider, type Locale } from "@/lib/i18n";

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  return (
    <LocaleProvider initialLocale={initialLocale}>
      <AuthProvider>{children}</AuthProvider>
    </LocaleProvider>
  );
}
