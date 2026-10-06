import Link from "next/link";
import { redirect } from "next/navigation";
import { PRODUCT_NAME, configured } from "@/lib/config";
import { Card } from "@/components/ui";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // Compatibility with emails already sent to the Site URL before the callback existed.
  if (params.code || params.error || params.error_code) {
    const query = new URLSearchParams();
    for (const key of ["code", "sb_flow_id", "error", "error_code"]) {
      if (typeof params[key] === "string") query.set(key, params[key]);
    }
    redirect(`/auth/callback?${query}`);
  }
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link className="brand" href="/">
          <span className="brand-mark">✦</span>
          {PRODUCT_NAME}
        </Link>
        <Link className="button secondary" href="/login">
          Entrar →
        </Link>
      </nav>
      <section className="landing-hero">
        <div>
          <p className="eyebrow">Aprender também pode ser uma aventura</p>
          <h1>
            Pequenas conquistas.
            <br />
            <span>Grandes descobertas.</span>
          </h1>
          <p className="muted">
            Transforme a rotina de estudos em missões e celebre cada passo com
            recompensas que fazem sentido para sua família.
          </p>
          <div className="row">
            <Link href="/login?signup=1" className="button">
              Começar nossa jornada →
            </Link>
            <span className="small muted">Simples. Em família.</span>
          </div>
        </div>
        <div className="preview" aria-label="Exemplo ilustrativo da interface">
          <p className="eyebrow">Uma jornada de cada vez</p>
          <h2>Vamos nessa, Lucas! 🦊</h2>
          <Card>
            <div className="between">
              <span>Suas conquistas</span>
              <span>✨</span>
            </div>
            <p className="points">50 pontos</p>
            <p className="small muted">Cada descoberta vale a pena.</p>
          </Card>
          <Card>
            <div className="row">
              <span className="list-icon">📖</span>
              <div>
                <h3>Ler por 20 minutos</h3>
                <span className="small muted">Uma nova missão te espera</span>
              </div>
            </div>
          </Card>
          <p className="small muted" style={{ marginTop: 16 }}>
            Prévia ilustrativa • os dados da sua família começam do zero
          </p>
        </div>
      </section>
      {!configured && (
        <div className="notice setup">
          O aplicativo está instalado. Para ativar contas e dados, configure as
          duas variáveis de ambiente do Supabase e execute{" "}
          <code>supabase/schema.sql</code>. Consulte o README.
        </div>
      )}
      <div className="grid-3">
        {[
          [
            "01",
            "Crie pequenas missões",
            "Organize estudos, rotina, comportamento e pontos no seu ritmo.",
          ],
          [
            "02",
            "Acompanhe cada conquista",
            "Aprove as atividades e veja o progresso de cada criança.",
          ],
          [
            "03",
            "Celebre em família",
            "Troque pontos por momentos e recompensas especiais.",
          ],
        ].map(([n, t, d]) => (
          <Card key={n}>
            <p className="eyebrow">{n}</p>
            <h3>{t}</h3>
            <p className="muted small" style={{ marginTop: 10 }}>
              {d}
            </p>
          </Card>
        ))}
      </div>
    </main>
  );
}
