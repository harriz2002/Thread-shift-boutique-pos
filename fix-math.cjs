const fs = require('fs');

let content = fs.readFileSync('src/components/SalesAnalytics.tsx', 'utf-8');

content = content.replace(
  "acc[cat] = (acc[cat] || 0) + ((item.unitPrice || 0) * (item.quantity || 1));",
  "acc[cat] = (acc[cat] || 0) + (Number(item.unitPrice || 0) * Number(item.quantity || 1));"
);

fs.writeFileSync('src/components/SalesAnalytics.tsx', content);
