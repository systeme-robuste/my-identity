import { useParams } from "react-router-dom";

export function Editor() {
  const { siteId, pageId } = useParams();
  return (
    <div className="h-screen flex">
      <aside className="w-64 border-r border-mi-muted/30 p-4">
        <h2 className="font-bold mb-4">Blocs</h2>
        <ul className="space-y-1 text-sm">
          <li className="px-2 py-1 rounded hover:bg-mi-muted/10">Hero</li>
          <li className="px-2 py-1 rounded hover:bg-mi-muted/10">Texte</li>
          <li className="px-2 py-1 rounded hover:bg-mi-muted/10">Image</li>
          <li className="px-2 py-1 rounded hover:bg-mi-muted/10">Galerie</li>
          <li className="px-2 py-1 rounded hover:bg-mi-muted/10">Formulaire</li>
          <li className="px-2 py-1 rounded hover:bg-mi-muted/10">CMS</li>
          <li className="px-2 py-1 rounded hover:bg-mi-muted/10">Embed</li>
          <li className="px-2 py-1 rounded hover:bg-mi-muted/10">Pricing</li>
          <li className="px-2 py-1 rounded hover:bg-mi-muted/10">FAQ</li>
        </ul>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-2xl font-bold mb-2">Éditeur</h1>
        <p className="text-mi-muted">Site: {siteId} — Page: {pageId ?? "index"}</p>
        <div className="mt-8 p-12 border-2 border-dashed border-mi-muted/30 rounded-mi text-center text-mi-muted">
          Zone de prévisualisation — éditeur à blocs (Phase 1)
        </div>
      </main>
      <aside className="w-80 border-l border-mi-muted/30 p-4">
        <h2 className="font-bold mb-4">Propriétés</h2>
        <p className="text-sm text-mi-muted">Sélectionnez un bloc pour modifier ses propriétés.</p>
      </aside>
    </div>
  );
}
