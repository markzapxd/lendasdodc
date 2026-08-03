import { readFileSync } from "node:fs";

const design = readFileSync("DESIGN.md", "utf-8");

const requiredSections = [
  "## 1. Project Identity",
  "## 2. Color System",
  "## 3. Typography",
  "## 4. Spacing System",
  "## 5. Breakpoints",
  "## 6. Depth and Shadows",
  "## 7. Motion and Animation",
  "## 8. Layout Primitives",
  "## 9. Semantic States",
  "## 10. Component Primitives",
  "## 11. Personas",
  "## 12. WCAG 2.2 AA Constraints",
  "## 13. Accessibility Checklist",
  "## 14. Accepted Debt Register",
  "## 15. Research Log",
];

const requiredTokens = [
  "--color-black",
  "--color-charcoal-900",
  "--color-charcoal-100",
  "--color-red-500",
  "--color-red-900",
  "--color-green-500",
  "--color-amber-500",
  "--color-surface",
  "--color-surface-elevated",
  "--color-text-primary",
  "--color-text-secondary",
  "--color-text-inverse",
  "--color-border",
  "--color-border-strong",
];

const forbidden = [
  "Google",
  "Apple",
  "Microsoft",
  "Facebook",
  "Twitter",
  "Stripe",
  "Vercel",
  "Supabase",
];

const missingSections = requiredSections.filter((section) => !design.includes(section));
if (missingSections.length) {
  console.error("Missing sections:", missingSections);
  process.exit(1);
}

const missingTokens = requiredTokens.filter((token) => !design.includes(token));
if (missingTokens.length) {
  console.error("Missing design tokens:", missingTokens);
  process.exit(1);
}

const foundBrands = forbidden.filter(
  (brand) => design.includes(brand) && !design.includes(`<!-- ${brand} -->`),
);
if (foundBrands.length) {
  console.warn("Warning: Found brand references:", foundBrands);
}

const requiredContrastClaims = ["4.5:1", "3:1", "13.75:1", "12.53:1", "4.78:1"];
const missingContrastClaims = requiredContrastClaims.filter((claim) => !design.includes(claim));
if (missingContrastClaims.length) {
  console.error("Missing contrast claims:", missingContrastClaims);
  process.exit(1);
}

console.log("DESIGN.md validation passed");
