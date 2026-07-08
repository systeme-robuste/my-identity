/**
 * App shell. Defines the 11 main routes.
 *
 * Implementation is stubbed — see README for the implementation plan.
 */

import { Route, Routes } from "react-router-dom";
import { Login } from "./routes/login";
import { Dashboard } from "./routes/dashboard";
import { Sites } from "./routes/sites";
import { Editor } from "./routes/editor";
import { Collections } from "./routes/collections";
import { Products } from "./routes/products";
import { Automations } from "./routes/automations";
import { Members } from "./routes/members";
import { Analytics } from "./routes/analytics";
import { Settings } from "./routes/settings";
import { Billing } from "./routes/billing";
import { AppShell } from "./components/layout/AppShell";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sites" element={<Sites />} />
        <Route path="/sites/:siteId/editor/:pageId?" element={<Editor />} />
        <Route path="/sites/:siteId/collections" element={<Collections />} />
        <Route path="/sites/:siteId/products" element={<Products />} />
        <Route path="/sites/:siteId/automations" element={<Automations />} />
        <Route path="/sites/:siteId/members" element={<Members />} />
        <Route path="/sites/:siteId/analytics" element={<Analytics />} />
        <Route path="/sites/:siteId/settings" element={<Settings />} />
        <Route path="/sites/:siteId/billing" element={<Billing />} />
      </Route>
    </Routes>
  );
}
