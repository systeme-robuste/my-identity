export function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Tableau de bord</h1>
      <p className="text-mi-muted mb-8">Vue d'ensemble de vos sites et de votre utilisation.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-mi border border-mi-muted/30">
          <h3 className="text-sm text-mi-muted">Sites actifs</h3>
          <p className="text-3xl font-bold mt-2">—</p>
        </div>
        <div className="p-6 rounded-mi border border-mi-muted/30">
          <h3 className="text-sm text-mi-muted">Visiteurs ce mois</h3>
          <p className="text-3xl font-bold mt-2">—</p>
        </div>
        <div className="p-6 rounded-mi border border-mi-muted/30">
          <h3 className="text-sm text-mi-muted">Formulaires soumis</h3>
          <p className="text-3xl font-bold mt-2">—</p>
        </div>
      </div>
    </div>
  );
}
