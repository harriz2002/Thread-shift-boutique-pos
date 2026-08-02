const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf-8');

appContent = appContent.replace(
  "import { Sidebar } from './components/Sidebar';",
  "import { Wifi, WifiOff } from 'lucide-react';\nimport { Sidebar } from './components/Sidebar';"
);

appContent = appContent.replace(
  "  const [stores, setStores] = useState<StoreLocation[]>(() => {",
  "  const [isOnline, setIsOnline] = useState(navigator.onLine);\n\n  useEffect(() => {\n    const handleOnline = () => setIsOnline(true);\n    const handleOffline = () => setIsOnline(false);\n    window.addEventListener('online', handleOnline);\n    window.addEventListener('offline', handleOffline);\n    return () => {\n      window.removeEventListener('online', handleOnline);\n      window.removeEventListener('offline', handleOffline);\n    };\n  }, []);\n\n  const [stores, setStores] = useState<StoreLocation[]>(() => {"
);

const bannerCode = `
      {/* Network Status Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white py-1.5 px-4 flex items-center justify-center gap-2 text-sm font-bold shadow-md shadow-red-500/20">
          <WifiOff className="w-4 h-4" />
          <span>You are currently offline. Changes will be synced when connection is restored.</span>
        </div>
      )}
      
      {/* Side Navigation Bar */}`;

appContent = appContent.replace("      {/* Side Navigation Bar */}", bannerCode);

fs.writeFileSync('src/App.tsx', appContent);
