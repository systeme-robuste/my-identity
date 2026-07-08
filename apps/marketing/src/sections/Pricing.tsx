export function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: 0,
      cta: "Commencer",
      href: "/signup",
      features: ["1 site", "5 pages", "Hébergement myidentity.app", "Communauté Discord"],
    },
    {
      name: "Pro",
      price: 9,
      cta: "Choisir Pro",
      href: "/signup?plan=pro",
      highlighted: true,
      features: ["5 sites", "50 pages / site", "Domaine personnalisé", "CMS + 5 collections", "Analytics de base", "Support email"],
    },
    {
      name: "Business",
      price: 49,
      cta: "Choisir Business",
      href: "/signup?plan=business",
      features: ["Sites illimités", "Pages illimitées", "E-commerce", "Memberships", "Automatisations IA", "API publique", "Support prioritaire"],
    },
  ];
  return (
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Tarifs simples. USD uniquement.</h2>
        <p className="text-mi-muted text-center mb-12">Pas de surprises. Paiement annuel ou mensuel. Annulation à tout moment.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`p-6 rounded-mi border ${t.highlighted ? "border-mi-primary bg-mi-primary/5" : "border-mi-muted/20"}`}
            >
              <h3 className="font-bold text-xl mb-1">{t.name}</h3>
              <p className="text-4xl font-bold mb-1">${t.price}<span className="text-base text-mi-muted">/an</span></p>
              <a href={t.href} className={`block text-center w-full py-2 rounded-mi mt-4 ${t.highlighted ? "mi-cta" : "border border-mi-muted/30"}`}>
                {t.cta}
              </a>
              <ul className="mt-6 space-y-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="text-mi-muted">✓ {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
