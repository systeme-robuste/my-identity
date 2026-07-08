export function Footer() {
  return (
    <footer className="border-t border-mi-muted/20 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <h4 className="font-bold mb-3">My Identity</h4>
          <p className="text-mi-muted">Construit à Kinshasa, RD Congo. Pensé pour le monde.</p>
        </div>
        <div>
          <h4 className="font-bold mb-3">Produit</h4>
          <ul className="space-y-1 text-mi-muted">
            <li><a href="#features">Fonctionnalités</a></li>
            <li><a href="#pricing">Tarifs</a></li>
            <li><a href="/docs">Documentation</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-3">Légal</h4>
          <ul className="space-y-1 text-mi-muted">
            <li><a href="/legal/terms">Conditions</a></li>
            <li><a href="/legal/privacy">Confidentialité</a></li>
            <li><a href="/legal/rga">RGPD</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-3">Communauté</h4>
          <ul className="space-y-1 text-mi-muted">
            <li><a href="https://github.com/systeme-robuste/my-identity">GitHub</a></li>
            <li><a href="https://discord.gg/myidentity">Discord</a></li>
            <li><a href="https://twitter.com/myidentity">Twitter</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-mi-muted/10 text-center text-xs text-mi-muted">
        © 2026 My Identity · MIT License · Construit sur Cloudflare + Neon + Stripe
      </div>
    </footer>
  );
}
