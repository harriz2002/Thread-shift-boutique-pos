const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf-8');

appContent = appContent.replace(
  "  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);",
  "  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);\n  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);"
);

appContent = appContent.replace(
  "className={`min-h-screen flex flex-col md:flex-row font-sans",
  "className={`min-h-screen flex font-sans" // Use standard flex row
);

appContent = appContent.replace(
  "<Sidebar\n        activeTab={activeTab}",
  "<Sidebar\n        isMobileMenuOpen={isMobileMenuOpen}\n        setIsMobileMenuOpen={setIsMobileMenuOpen}\n        activeTab={activeTab}"
);

appContent = appContent.replace(
  "<TopBar\n          lowStockCount={lowStockCount}",
  "<TopBar\n          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}\n          lowStockCount={lowStockCount}"
);

fs.writeFileSync('src/App.tsx', appContent);
