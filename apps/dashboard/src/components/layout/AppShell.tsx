import { NavLink, Outlet } from "react-router-dom";

const nav = [
  { to: "/", label: "Tableau de bord", end: true },
  { to: "/sites", label: "Sites" },
];

export function AppShell() {
  return (
    <div className="min-h-screen flex bg-mi-bg text-mi-fg">
      <aside className="w-56 border-r border-mi-muted/30 p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-8">My Identity</h1>
        <nav className="flex-1 space-y-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-mi text-sm ${isActive ? "bg-mi-primary text-white" : "hover:bg-mi-muted/10"}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="text-xs text-mi-muted mt-8">v0.1.0</div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
