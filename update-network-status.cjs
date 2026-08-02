const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf-8');

appContent = appContent.replace(
  "  const [isOnline, setIsOnline] = useState(navigator.onLine);",
  "  const [isOnline, setIsOnline] = useState(navigator.onLine);\n  const [showOnlineAlert, setShowOnlineAlert] = useState(false);"
);

appContent = appContent.replace(
  "    const handleOnline = () => setIsOnline(true);",
  "    const handleOnline = () => {\n      setIsOnline(true);\n      setShowOnlineAlert(true);\n      setTimeout(() => setShowOnlineAlert(false), 3000);\n    };"
);

const newBannerCode = `      {/* Network Status Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white py-1.5 px-4 flex items-center justify-center gap-2 text-sm font-bold shadow-md shadow-red-500/20">
          <WifiOff className="w-4 h-4" />
          <span>You are currently offline. Changes will be saved locally and synced when connection is restored.</span>
        </div>
      )}
      
      {showOnlineAlert && isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-emerald-500 text-white py-1.5 px-4 flex items-center justify-center gap-2 text-sm font-bold shadow-md shadow-emerald-500/20 transition-all animate-in slide-in-from-top-full">
          <Wifi className="w-4 h-4" />
          <span>Connection restored. System is online.</span>
        </div>
      )}
      
      {/* Side Navigation Bar */}`;

appContent = appContent.replace(
  /{ \/\* Network Status Banner \*\/ }[\s\S]*?{ \/\* Side Navigation Bar \*\/ }/,
  newBannerCode
);

fs.writeFileSync('src/App.tsx', appContent);
