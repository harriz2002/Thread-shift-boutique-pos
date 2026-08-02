const fs = require('fs');

let configContent = fs.readFileSync('vite.config.ts', 'utf-8');

configContent = configContent.replace(
  "globPatterns: ['**/*.{js,css,html,ico,png,svg}'],",
  "globPatterns: ['**/*.{js,css,html,ico,png,svg}'],\n          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB"
);

fs.writeFileSync('vite.config.ts', configContent);
