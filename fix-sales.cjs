const fs = require('fs');

let content = fs.readFileSync('src/components/SalesAnalytics.tsx', 'utf-8');

content = content.replace(
  "(transactions || []).reduce((acc, tx) => {",
  "(transactions || []).reduce((acc: Record<string, number>, tx) => {"
);

content = content.replace(
  "formatter={(value) => formatCurrency(value)}",
  "formatter={(value: any) => formatCurrency(Number(value))}"
);
content = content.replace(
  "formatter={(value) => formatCurrency(value)}",
  "formatter={(value: any) => formatCurrency(Number(value))}"
);
content = content.replace(
  "formatter={(value) => formatCurrency(value)}",
  "formatter={(value: any) => formatCurrency(Number(value))}"
);

fs.writeFileSync('src/components/SalesAnalytics.tsx', content);

let viteTypes = `/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
`;
fs.writeFileSync('src/vite-env.d.ts', viteTypes);
