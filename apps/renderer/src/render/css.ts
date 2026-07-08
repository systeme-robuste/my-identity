/**
 * Compile a per-site CSS bundle from the site's design tokens.
 * Returns a single string of minified CSS to inline in <style>.
 */

import type { Site } from "@my-identity/shared";

export interface DesignTokens {
  colors?: {
    bg?: string;
    fg?: string;
    primary?: string;
    accent?: string;
    muted?: string;
  };
  font?: {
    family?: string;
    size?: string;
  };
  radius?: string;
  spacing?: string;
  customCss?: string;
}

export function compileCss(design: DesignTokens | undefined | null): string {
  const d = design ?? {};
  const c = d.colors ?? {};
  const f = d.font ?? {};

  const vars: string[] = [
    `--mi-bg:${c.bg ?? "#0a0e27"};`,
    `--mi-fg:${c.fg ?? "#f4f4f8"};`,
    `--mi-primary:${c.primary ?? "#7c3aed"};`,
    `--mi-accent:${c.accent ?? "#06b6d4"};`,
    `--mi-muted:${c.muted ?? "#94a3b8"};`,
    `--mi-font:${f.family ?? "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"};`,
    `--mi-size:${f.size ?? "16px"};`,
    `--mi-radius:${d.radius ?? "12px"};`,
    `--mi-spacing:${d.spacing ?? "1rem"};`,
  ];

  return [
    `:root{${vars.join("")}}`,
    `*,*::before,*::after{box-sizing:border-box}`,
    `html,body{margin:0;padding:0;background:var(--mi-bg);color:var(--mi-fg);font-family:var(--mi-font);font-size:var(--mi-size);line-height:1.6;-webkit-font-smoothing:antialiased}`,
    `img{max-width:100%;height:auto;display:block}`,
    `a{color:var(--mi-primary);text-decoration:none}a:hover{text-decoration:underline}`,
    `.mi-cta{display:inline-block;padding:0.75rem 1.5rem;background:var(--mi-primary);color:#fff;border-radius:var(--mi-radius);font-weight:600;border:0;cursor:pointer;text-decoration:none}.mi-cta:hover{filter:brightness(1.1);text-decoration:none}`,
    `section.mi-block{padding:calc(var(--mi-spacing) * 2) var(--mi-spacing);max-width:72rem;margin:0 auto}`,
    `.mi-block-hero h1{font-size:clamp(2rem,5vw,4rem);margin:0 0 1rem}`,
    `.mi-block-text{max-width:48rem}`,
    `.mi-block-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem}`,
    `.mi-block-pricing{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem}`,
    `.mi-tier{padding:1.5rem;border:1px solid var(--mi-muted);border-radius:var(--mi-radius)}`,
    `.mi-tier-price{font-size:2rem;font-weight:700;margin:0.5rem 0}`,
    `.mi-block-faq details{margin-bottom:0.5rem;border-bottom:1px solid var(--mi-muted)}`,
    `.mi-block-faq summary{cursor:pointer;padding:0.75rem 0;font-weight:600}`,
    `footer.mi-block-footer{border-top:1px solid var(--mi-muted);text-align:center;color:var(--mi-muted);font-size:0.875rem}`,
    `@media (prefers-reduced-motion:no-preference){*{scroll-behavior:smooth}}`,
    d.customCss ?? "",
  ].join("");
}
