const fs = require('fs');

let content = fs.readFileSync('src/components/InventoryMatrixManager.tsx', 'utf-8');

const exportFunc = `  const exportPurchaseOrdersCSV = () => {
    const headers = [
      'PO Number',
      'Supplier Name',
      'Status',
      'Expected Date',
      'Total Estimated Cost',
      'Items JSON'
    ];
    
    const rows = (purchaseOrders || []).map(po => [
      po.poNumber,
      po.supplierName,
      po.status,
      po.expectedDate,
      po.totalEstimatedCost,
      JSON.stringify(po.items)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => \`"\${String(cell).replace(/"/g, '""')}"\`).join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', \`Supplier_Ledger_POs_\${new Date().toISOString().split('T')[0]}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
`;

content = content.replace("  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>(activeStoreId);", "  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>(activeStoreId);\n" + exportFunc);

content = content.replace("import { \n  Layers, \n", "import { \n  Layers, \n  Download, \n");

const generateBtnRegex = /<button\s+onClick=\{handleGeneratePO\}[\s\S]*?<\/button>/;
const generateBtnMatch = content.match(generateBtnRegex);

if (generateBtnMatch) {
  const newBtns = `
            <div className="flex items-center gap-2">
              <button
                onClick={exportPurchaseOrdersCSV}
                className="py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export Supplier Ledger</span>
              </button>
              ${generateBtnMatch[0]}
            </div>`;
  content = content.replace(generateBtnMatch[0], newBtns);
}

fs.writeFileSync('src/components/InventoryMatrixManager.tsx', content);
