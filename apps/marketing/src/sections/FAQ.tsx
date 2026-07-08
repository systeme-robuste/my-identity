const items = [
  { q: "Puis-je migrer mon site Carrd existant ?", a: "Oui. Notre importateur copie votre HTML, CSS et assets. Les pages multi-pages sont dédupliquées automatiquement." },
  { q: "Pourquoi USD uniquement ?", a: "Nous opérons depuis la RDC et facturons en USD pour stabiliser nos prix face à la volatilité du CDF. Les prix sont fixes en dollars, quelle que soit votre devise de paiement." },
  { q: "Mes sites sont-ils en JavaScript côté client ?", a: "Non. Par défaut, My Identity produit du HTML pur servi depuis l'edge. Vous pouvez ajouter du JS si vous le souhaitez, mais la plateforme est conçue pour ne pas en avoir besoin." },
  { q: "Qu'est-ce qui distingue My Identity de Carrd ?", a: "Carrd est limité aux one-pagers. My Identity supporte les sites multi-pages, le CMS, l'e-commerce, les memberships, les automatisations — le tout sans JavaScript côté client." },
  { q: "Et par rapport à Webflow ?", a: "Webflow est plus puissant en design mais plus complexe, plus cher, et plus lent (pas d'edge rendering par défaut). My Identity mise sur la simplicité, la performance et le prix." },
  { q: "Comment fonctionne la conformité RGPD ?", a: "Tous les serveurs sont chez Cloudflare (UE pour les clients européens) et Neon (UE). Export et suppression des données sont disponibles en un clic. Audit RGPD complet en Phase 1." },
  { q: "Y a-t-il un plan gratuit ?", a: "Oui — 1 site, 5 pages, sous-domaine myidentity.app. Aucune carte requise." },
  { q: "Quand est-ce que je peux m'inscrire ?", a: "Phase 1 (MVP Foundations) est en cours. La beta privée ouvre Q4 2026. Inscrivez-vous sur la liste d'attente pour être notifié." },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 px-6 border-t border-mi-muted/20">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Questions fréquentes</h2>
        <div className="space-y-2">
          {items.map((it) => (
            <details key={it.q} className="border-b border-mi-muted/20 py-4">
              <summary className="cursor-pointer font-semibold">{it.q}</summary>
              <p className="mt-2 text-mi-muted text-sm">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
