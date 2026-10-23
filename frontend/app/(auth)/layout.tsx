import { LangToggle } from "@/components/lang-toggle";

// POZOR: tady NESMÍ být vlastní <AuthProvider>. Root (app/providers.tsx) ho už
// dodává celé appce. Druhá instance tu způsobila, že přihlášení nastavilo
// uživatele jen do téhle vnitřní instance, ale po `router.push('/dashboard')`
// se zahodila a chráněné stránky četly root instanci, která o loginu nevěděla
// → okamžitý bounce zpět na /login a 401 na /auth/me. Jeden provider = jeden stav.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="fixed top-4 right-4 z-20">
        <LangToggle />
      </div>
      {/* Dekorativní kulečky — mystické kameny v rohu */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, oklch(0.78 0.11 196) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-10 -left-16 w-56 h-56 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, oklch(0.65 0.15 155) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.78 0.11 196) 0%, transparent 70%)" }}
        />
      </div>
      {children}
    </div>
  );
}
