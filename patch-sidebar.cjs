const fs = require('fs');

let sidebarContent = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

sidebarContent = sidebarContent.replace(
  "import { StoreLocation, UserAccount } from '../types';",
  "import { StoreLocation, UserAccount } from '../types';\nimport { X } from 'lucide-react';"
);

sidebarContent = sidebarContent.replace(
  "interface SidebarProps {",
  "interface SidebarProps {\n  isMobileMenuOpen?: boolean;\n  setIsMobileMenuOpen?: (open: boolean) => void;"
);

sidebarContent = sidebarContent.replace(
  "  onOpenStoreManager,\n}) => {",
  "  onOpenStoreManager,\n  isMobileMenuOpen = false,\n  setIsMobileMenuOpen,\n}) => {"
);

sidebarContent = sidebarContent.replace(
  "<aside className=\"bg-slate-900 text-slate-100 border-b md:border-b-0 md:border-r border-slate-800 z-30 shadow-md transition-colors dark:bg-slate-900 dark:border-slate-800 light:bg-white light:border-slate-200 w-full md:w-64 shrink-0 flex flex-col md:h-screen sticky top-0 overflow-y-auto no-scrollbar\">",
  `<aside className={\`bg-slate-900 text-slate-100 border-r border-slate-800 z-[100] shadow-md transition-all duration-300 dark:bg-slate-900 dark:border-slate-800 light:bg-white light:border-slate-200 w-64 shrink-0 flex flex-col h-screen fixed md:sticky top-0 overflow-y-auto no-scrollbar \${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}\`}>`
);

sidebarContent = sidebarContent.replace(
  "<div className=\"flex flex-col gap-3\">",
  `<div className="flex flex-col gap-3">
          {setIsMobileMenuOpen && (
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden absolute top-4 right-4 p-2 bg-slate-800 text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          )}`
);

fs.writeFileSync('src/components/Sidebar.tsx', sidebarContent);
