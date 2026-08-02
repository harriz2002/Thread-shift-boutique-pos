const fs = require('fs');

let content = fs.readFileSync('src/components/CustomerLoyaltyManager.tsx', 'utf-8');

const exportFunc = `  const exportCustomersCSV = () => {
    const headers = [
      'Customer ID',
      'Name',
      'Phone',
      'Email',
      'Loyalty Tier',
      'Points Balance',
      'Store Credit',
      'Top Size',
      'Bottom Size',
      'Favorite Colors',
      'Total Lifetime Spent',
      'Total Orders',
      'Join Date'
    ];
    
    const rows = customers.map(c => [
      c.id,
      c.name,
      c.phone,
      c.email,
      c.tier,
      c.loyaltyPoints,
      c.storeCredit,
      c.sizePreferences.topSize,
      c.sizePreferences.bottomSize,
      (c.sizePreferences.favoriteColors || []).join('; '),
      c.totalSpent,
      c.totalOrders,
      c.createdAt
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => \`"\${String(cell).replace(/"/g, '""')}"\`).join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', \`Customer_Ledger_\${new Date().toISOString().split('T')[0]}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
`;

content = content.replace("  const filteredCustomers = customers.filter((c) => {", exportFunc + "\n  const filteredCustomers = customers.filter((c) => {");

content = content.replace("import { \n  Users, \n  UserPlus, \n", "import { \n  Users, \n  UserPlus, \n  Download, \n");

const buttonsUI = `        <div className="flex items-center gap-2">
          <button
            onClick={exportCustomersCSV}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Export Ledger CSV</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Profile</span>
          </button>
        </div>`;

content = content.replace(`        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Customer Profile</span>
        </button>`, buttonsUI);

fs.writeFileSync('src/components/CustomerLoyaltyManager.tsx', content);
