export function Login() {
  return (
    <div className="min-h-screen grid place-items-center bg-mi-bg text-mi-fg">
      <form className="w-96 p-8 rounded-mi border border-mi-muted/30">
        <h1 className="text-2xl font-bold mb-6">Connexion</h1>
        <label className="block mb-3">
          <span className="text-sm text-mi-muted">Email</span>
          <input
            type="email"
            name="email"
            required
            className="mt-1 w-full px-3 py-2 bg-mi-bg border border-mi-muted/30 rounded-mi"
          />
        </label>
        <label className="block mb-6">
          <span className="text-sm text-mi-muted">Mot de passe</span>
          <input
            type="password"
            name="password"
            required
            className="mt-1 w-full px-3 py-2 bg-mi-bg border border-mi-muted/30 rounded-mi"
          />
        </label>
        <button type="submit" className="mi-cta w-full">Se connecter</button>
        <p className="mt-4 text-sm text-mi-muted text-center">
          Pas encore de compte ? <a className="text-mi-primary" href="/signup">S'inscrire</a>
        </p>
      </form>
    </div>
  );
}
