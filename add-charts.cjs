const fs = require('fs');

let content = fs.readFileSync('src/components/SalesAnalytics.tsx', 'utf-8');

// 1. Add imports for recharts
content = content.replace(
  "import { \n  BarChart3, ",
  "import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';\nimport { \n  BarChart3, "
);

// 2. Compute chart data
const chartDataCode = `
  // Prepare Hourly Sales Data
  const hourlyData = Array.from({ length: 24 }).map((_, i) => ({
    hour: \`\${String(i).padStart(2, '0')}:00\`,
    sales: 0,
    orders: 0
  }));

  (filteredDailyTransactions || []).forEach(tx => {
    const rawDate = tx.date || tx.timestamp;
    if (rawDate) {
      const dateObj = new Date(rawDate);
      const hour = dateObj.getHours();
      hourlyData[hour].sales += (tx.total || 0);
      hourlyData[hour].orders += 1;
    }
  });

  // Prepare Top Categories Data
  const categorySalesData = Object.entries(
    (transactions || []).reduce((acc, tx) => {
      (tx.items || []).forEach(item => {
        const cat = item.product?.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + ((item.unitPrice || 0) * (item.quantity || 1));
      });
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

  const CATEGORY_COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];

  // Calculate Most Bought to Least Bought Products`;

content = content.replace('  // Calculate Most Bought to Least Bought Products', chartDataCode);

// 3. Add UI components in the overview
const chartsUI = `
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Total Sales Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono font-extrabold text-xl text-emerald-400">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[10px] text-slate-500">Across all store channels & M-Pesa</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Gross Margin</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono font-extrabold text-xl text-amber-400">
            {formatCurrency(grossProfit)}
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              ({grossMarginPercent.toFixed(1)}%)
            </span>
          </div>
          <p className="text-[10px] text-slate-500">Net after garment wholesale cost</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Completed Orders</span>
            <ShoppingBag className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-mono font-extrabold text-xl text-slate-100">
            {totalOrders}
          </div>
          <p className="text-[10px] text-slate-500">Avg Basket: {formatCurrency(avgOrderValue)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Remaining Stock Inventory</span>
            <Boxes className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-mono font-extrabold text-xl text-slate-100">
            {totalRemainingStock} <span className="text-xs font-normal text-slate-400">Garments</span>
          </div>
          <p className="text-[10px] text-slate-500">Available across all storage locations</p>
        </div>

      </div>

      {/* Visual Analytics Dashboards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Sales Trends */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <span>Hourly Sales Trends (Filtered Date)</span>
            </h3>
            <p className="text-xs text-slate-400">Visualize revenue generation by time of day</p>
          </div>
          <div className="h-64 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="hour" stroke="#475569" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(val) => \`\${val / 1000}k\`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}
                  itemStyle={{ color: '#fbbf24' }}
                  formatter={(value) => formatCurrency(value)}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                />
                <Line type="monotone" dataKey="sales" name="Revenue" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: '#fbbf24', strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="mb-4">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              <span>Top Categories</span>
            </h3>
            <p className="text-xs text-slate-400">Highest grossing product segments</p>
          </div>
          <div className="h-64 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySalesData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#475569" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} hide />
                <YAxis dataKey="name" type="category" stroke="#475569" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}
                  itemStyle={{ color: '#fbbf24' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar dataKey="value" name="Revenue" radius={[0, 4, 4, 0]} barSize={24}>
                  {categorySalesData.map((entry, index) => (
                    <Cell key={\`cell-\${index}\`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
`;

content = content.replace(
  `      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Total Sales Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono font-extrabold text-xl text-emerald-400">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[10px] text-slate-500">Across all store channels & M-Pesa</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Gross Margin</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono font-extrabold text-xl text-amber-400">
            {formatCurrency(grossProfit)}
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              ({grossMarginPercent.toFixed(1)}%)
            </span>
          </div>
          <p className="text-[10px] text-slate-500">Net after garment wholesale cost</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Completed Orders</span>
            <ShoppingBag className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-mono font-extrabold text-xl text-slate-100">
            {totalOrders}
          </div>
          <p className="text-[10px] text-slate-500">Avg Basket: {formatCurrency(avgOrderValue)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Remaining Stock Inventory</span>
            <Boxes className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-mono font-extrabold text-xl text-slate-100">
            {totalRemainingStock} <span className="text-xs font-normal text-slate-400">Garments</span>
          </div>
          <p className="text-[10px] text-slate-500">Available across all storage locations</p>
        </div>

      </div>`,
  chartsUI
);

fs.writeFileSync('src/components/SalesAnalytics.tsx', content);
