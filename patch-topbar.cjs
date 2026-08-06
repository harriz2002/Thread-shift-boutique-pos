const fs = require('fs');

let topbarContent = fs.readFileSync('src/components/TopBar.tsx', 'utf-8');

topbarContent = topbarContent.replace(
  "import {\n  QrCode,",
  "import {\n  Menu,\n  QrCode,"
);

topbarContent = topbarContent.replace(
  "interface TopBarProps {",
  "interface TopBarProps {\n  onToggleMobileMenu?: () => void;"
);

topbarContent = topbarContent.replace(
  "  setActiveTab,\n}) => {",
  "  setActiveTab,\n  onToggleMobileMenu,\n}) => {"
);

topbarContent = topbarContent.replace(
  "<header className=\"bg-slate-900 text-slate-100 border-b border-slate-800 z-20 shadow-sm px-4 sm:px-6 h-16 flex items-center justify-end shrink-0 sticky top-0 transition-colors dark:bg-slate-900 dark:border-slate-800 light:bg-white light:border-slate-200\">",
  `<header className="bg-slate-900 text-slate-100 border-b border-slate-800 z-20 shadow-sm px-4 sm:px-6 h-16 flex items-center justify-between shrink-0 sticky top-0 transition-colors dark:bg-slate-900 dark:border-slate-800 light:bg-white light:border-slate-200">
      <div className="flex items-center gap-2 md:hidden">
        {onToggleMobileMenu && (
          <button onClick={onToggleMobileMenu} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="font-bold text-amber-500 text-sm">T&S POS</div>
      </div>`
);

fs.writeFileSync('src/components/TopBar.tsx', topbarContent);
