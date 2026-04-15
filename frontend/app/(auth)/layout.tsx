import { AuthProvider } from "@/lib/auth-context";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
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
    </AuthProvider>
  );
}
