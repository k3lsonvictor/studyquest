import Link from "next/link";
export default function NotFound() {
  return (
    <main className="auth-page">
      <div className="card auth-card">
        <h1>Página não encontrada.</h1>
        <p className="muted" style={{ margin: "20px 0" }}>
          Este caminho não faz parte da sua jornada.
        </p>
        <Link className="button" href="/app">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
