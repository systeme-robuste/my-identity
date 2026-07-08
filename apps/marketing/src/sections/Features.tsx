export function Features() {
  const items = [
    { title: "Multi-pages illimitées", body: "Contrairement à Carrd, My Identity supporte des sites à plusieurs pages avec navigation, SEO par page, et slugs custom." },
    { title: "CMS natif", body: "Créez des collections (blog, projets, témoignages…) et liez-les à vos pages. Pas besoin d'Airtable ou de Notion en parallèle." },
    { title: "E-commerce intégré", body: "Produits, variantes, panier, Stripe Checkout, abonnements. Pas besoin de Shopify pour vendre." },
    { title: "A/B testing", body: "Testez des variantes de page et mesurez la conversion. Cookies sticky, statistiques en temps réel." },
    { title: "Memberships & gated content", body: "Tiers d'adhésion, accès privé, paywall par article. Stripe Subscriptions intégré." },
    { title: "Automatisations IA", body: "Workflows visuels : déclencheur → conditions → actions (email, webhook, Mistral AI, Resend)." },
  ];
  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Tout ce que Carrd manque</h2>
        <p className="text-mi-muted text-center mb-12 max-w-2xl mx-auto">
          Carrd est parfait pour un one-pager. Mais dès que vous avez besoin d'un blog, d'un catalogue, ou d'un tunnel de vente, il faut tout rebuilder ailleurs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <div key={it.title} className="p-6 rounded-mi border border-mi-muted/20">
              <h3 className="font-bold text-lg mb-2">{it.title}</h3>
              <p className="text-sm text-mi-muted">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
