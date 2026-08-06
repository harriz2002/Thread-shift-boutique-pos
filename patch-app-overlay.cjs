const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf-8');

appContent = appContent.replace(
  "<Sidebar\n        isMobileMenuOpen={isMobileMenuOpen}\n        setIsMobileMenuOpen={setIsMobileMenuOpen}\n        activeTab={activeTab}",
  `{isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeTab={activeTab}`
);

fs.writeFileSync('src/App.tsx', appContent);
