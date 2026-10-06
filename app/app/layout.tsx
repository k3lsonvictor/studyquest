import Link from "next/link";
import { session } from "@/services/family";
import { PRODUCT_NAME, demoMode } from "@/lib/config";
import { Navigation } from "@/components/navigation";
import { ProductTour } from "@/features/tour/product-tour";
export const dynamic = "force-dynamic";
export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await session(true);
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/app">
          <span className="brand-mark">✦</span>
          {PRODUCT_NAME}
        </Link>
        <div>
          <p className="eyebrow" style={{ paddingLeft: 15 }}>
            Nossa jornada
          </p>
          <Navigation />
        </div>
        <div className="sidebar-note">
          <span>🌱</span>
          <h3>Cada passo conta.</h3>
          <p className="muted">
            O importante é aprender um pouquinho a cada dia.
          </p>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="muted small">
            Um espaço para aprender e crescer juntos.
          </span>
          <Link className="brand" href="/app">
            <span className="brand-mark">✦</span>
            {PRODUCT_NAME}
          </Link>
          <Link href="/app/profile" className="family-pill">
            <span className="family-name">
              {user.user_metadata.name || "Responsável"}
            </span>
            <span className="avatar-mini">☀</span>
          </Link>
        </header>
        <main className="main">
          {demoMode && (
            <div className="notice success small">
              Demonstração local · Dados fictícios · Alterações são apagadas ao
              reiniciar.
            </div>
          )}
          <ProductTour role="parent" identity={user.id} />
          {children}
        </main>
      </div>
      <Navigation mobile />
    </div>
  );
}
