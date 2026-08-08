export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return 'Ksh 0';
  return `Ksh ${amount.toLocaleString('en-KE', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;
}

export function maskPhoneNumber(phone?: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  if (!trimmed) return '';

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 6) {
    return trimmed.replace(/\d/g, '*');
  }

  const totalDigits = digits.length;
  const keepEnd = 3;
  const keepStart = totalDigits <= 10 ? 4 : totalDigits - 6;

  let digitIndex = 0;
  return trimmed.replace(/\d/g, (char) => {
    const currentIndex = digitIndex++;
    if (currentIndex >= keepStart && currentIndex < totalDigits - keepEnd) {
      return '*';
    }
    return char;
  });
}

