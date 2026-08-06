const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf-8');

appContent = appContent.replace(
  "const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);",
  "const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);\n  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);"
);

fs.writeFileSync('src/App.tsx', appContent);
