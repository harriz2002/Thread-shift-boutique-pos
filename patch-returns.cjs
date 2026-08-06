const fs = require('fs');

let content = fs.readFileSync('src/components/ReturnsAndExchangesModal.tsx', 'utf-8');

content = content.replace(/\$\{tx.total.toFixed\(2\)\}/g, "KSh ${tx.total.toFixed(2)}");
content = content.replace(/\$\{selectedTx.total.toFixed\(2\)\}/g, "KSh ${selectedTx.total.toFixed(2)}");
content = content.replace(/\$\{\(item.unitPrice \* item.quantity - item.discountAmount\).toFixed\(2\)\}/g, "KSh ${(item.unitPrice * item.quantity - item.discountAmount).toFixed(2)}");
content = content.replace(/\$\{refundAmount.toFixed\(2\)\}/g, "KSh ${refundAmount.toFixed(2)}");

fs.writeFileSync('src/components/ReturnsAndExchangesModal.tsx', content);
