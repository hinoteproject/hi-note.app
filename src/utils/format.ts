// Format tiền VND
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

// Format tiền ngắn gọn (1.5M, 500k)
export function formatMoneyShort(amount: number): string {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1).replace('.0', '') + 'M';
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + 'k';
  }
  return amount.toString();
}

// Format ngày giờ
export function formatDateTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

// Format ngày
export function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN');
}

// Tạo VietQR URL
export function generateVietQRUrl(
  bankId: string,
  accountNumber: string,
  accountName: string,
  amount: number,
  description: string
): string {
  // VietQR format
  const template = 'compact2';
  return `https://img.vietqr.io/image/${bankId}-${accountNumber}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;
}

// Bank codes cho VietQR
export const BANK_CODES: Record<string, string> = {
  'Vietcombank': 'VCB',
  'Techcombank': 'TCB',
  'MB Bank': 'MB',
  'VPBank': 'VPB',
  'ACB': 'ACB',
  'Sacombank': 'STB',
  'BIDV': 'BIDV',
  'Agribank': 'VBA',
  'TPBank': 'TPB',
  'VietinBank': 'CTG',
  'Momo': 'MOMO',
};
