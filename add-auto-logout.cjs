const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf-8');

const autoLogoutCode = `  // Auto-logout after 20 minutes of inactivity
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      if (currentUser) {
        timeoutId = setTimeout(() => {
          setCurrentUser(null);
          localStorage.removeItem('ts_current_user');
          setIsAuthModalOpen(true);
        }, 20 * 60 * 1000); // 20 minutes
      }
    };

    if (currentUser) {
      resetTimer(); // Initialize timer
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => document.addEventListener(event, resetTimer, { passive: true }));
      
      return () => {
        clearTimeout(timeoutId);
        events.forEach(event => document.removeEventListener(event, resetTimer));
      };
    }
  }, [currentUser]);

  // Firebase Database & Cloud SQL PostgreSQL Dual-Layer Sync Status`;

appContent = appContent.replace(
  "  // Firebase Database & Cloud SQL PostgreSQL Dual-Layer Sync Status",
  autoLogoutCode
);

fs.writeFileSync('src/App.tsx', appContent);
