export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return 'KSh 0';
  return `KSh ${amount.toLocaleString('en-KE', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;
}
