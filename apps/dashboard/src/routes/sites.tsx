export function Sites() {
  return (
    <div className="p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Sites</h1>
        <button className="mi-cta">+ Nouveau site</button>
      </header>
      <p className="text-mi-muted">Vous n'avez pas encore de site. Cliquez sur "Nouveau site" pour commencer.</p>
    </div>
  );
}
