const fs = require('fs');

let content = fs.readFileSync('src/components/SalesAnalytics.tsx', 'utf-8');

content = content.replace(
  ").map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);",
  ").map(([name, value]) => ({ name, value: Number(value) })).sort((a, b) => b.value - a.value).slice(0, 5);"
);

fs.writeFileSync('src/components/SalesAnalytics.tsx', content);
