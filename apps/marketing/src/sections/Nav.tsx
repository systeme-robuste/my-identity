export function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-mi-bg/80 border-b border-mi-muted/20">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-bold">My Identity</a>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#features" className="hover:text-mi-primary">Fonctionnalités</a>
          <a href="#pricing" className="hover:text-mi-primary">Tarifs</a>
          <a href="#faq" className="hover:text-mi-primary">FAQ</a>
          <a href="/docs" className="hover:text-mi-primary">Docs</a>
        </nav>
        <a href="/signup" className="mi-cta">Commencer</a>
      </div>
    </header>
  );
}
