"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="auth-page">
      <div className="card auth-card" role="alert">
        <h1>Não conseguimos carregar esta página.</h1>
        <p className="muted" style={{ margin: "20px 0" }}>
          Verifique sua conexão e a configuração do Supabase. Seus dados salvos
          continuam no banco.
        </p>
        <button className="button" onClick={reset}>
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
