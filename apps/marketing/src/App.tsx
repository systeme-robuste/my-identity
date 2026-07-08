/**
 * Marketing site. Renders all 10 sections. The visual reference (the
 * currently published 0-JS version) lives in `public/reference-landing.html`.
 */

import { Nav } from "./sections/Nav";
import { Hero } from "./sections/Hero";
import { Features } from "./sections/Features";
import { Capabilities } from "./sections/Capabilities";
import { Pricing } from "./sections/Pricing";
import { Calculator } from "./sections/Calculator";
import { CaseStudy } from "./sections/CaseStudy";
import { FAQ } from "./sections/FAQ";
import { CTA } from "./sections/CTA";
import { Footer } from "./sections/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-mi-bg text-mi-fg">
      <Nav />
      <main>
        <Hero />
        <Features />
        <Capabilities />
        <Pricing />
        <Calculator />
        <CaseStudy />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
