export function Hero() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-sm text-mi-muted mb-4 uppercase tracking-widest">v0.1 — Pré-lancement</p>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Au-delà de Carrd. Au-delà de Systeme.io. Au-delà de tout.
        </h1>
        <p className="text-lg md:text-xl text-mi-muted max-w-2xl mx-auto mb-8">
          My Identity est la plateforme no-code professionnelle construite pour la prochaine décennie.
          Sites multi-pages, CMS natif, e-commerce, tests A/B, memberships, automatisations IA.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/signup" className="mi-cta">Démarrer gratuitement</a>
          <a href="#pricing" className="text-mi-primary hover:underline">Voir les tarifs →</a>
        </div>
      </div>
    </section>
  );
}
