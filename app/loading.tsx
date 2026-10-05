export default function Loading() {
  return (
    <main className="main" aria-busy="true" aria-label="Carregando">
      <p className="muted" style={{ marginBottom: 20 }}>
        Preparando sua jornada…
      </p>
      <div className="stack">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    </main>
  );
}
