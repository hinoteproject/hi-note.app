import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Order } from '../types';

const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

const formatDateTime = (date: Date) => {
  const d = new Date(date);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const generateInvoiceHTML = (order: Order, shopName = 'Hi-Note') => {
  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px dashed #ddd;">${item.productName}</td>
      <td style="padding: 8px 0; border-bottom: 1px dashed #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px 0; border-bottom: 1px dashed #ddd; text-align: right;">${formatMoney(item.unitPrice)}</td>
      <td style="padding: 8px 0; border-bottom: 1px dashed #ddd; text-align: right;">${formatMoney(item.subtotal)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #333; }
        .shop-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .invoice-title { font-size: 14px; color: #666; }
        .info { margin-bottom: 15px; font-size: 13px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }
        th { padding: 10px 0; border-bottom: 2px solid #333; text-align: left; font-weight: 600; }
        th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
        th:nth-child(2) { text-align: center; }
        .total-section { border-top: 2px solid #333; padding-top: 15px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .total-main { font-size: 20px; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #333; }
        .footer { text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px dashed #999; font-size: 12px; color: #666; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .status-paid { background: #D1FAE5; color: #059669; }
        .status-pending { background: #FEF3C7; color: #D97706; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="shop-name">🏪 ${shopName}</div>
        <div class="invoice-title">HÓA ĐƠN BÁN HÀNG</div>
      </div>
      
      <div class="info">
        <div class="info-row">
          <span>Mã đơn:</span>
          <strong>#${order.id.slice(-6).toUpperCase()}</strong>
        </div>
        <div class="info-row">
          <span>Ngày:</span>
          <span>${formatDateTime(order.createdAt)}</span>
        </div>
        ${order.tableNumber ? `
        <div class="info-row">
          <span>Bàn:</span>
          <span>${order.tableNumber}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span>Trạng thái:</span>
          <span class="status ${order.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}">
            ${order.paymentStatus === 'paid' ? '✓ Đã thanh toán' : '⏳ Chờ thanh toán'}
          </span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>SL</th>
            <th>Đơn giá</th>
            <th>T.Tiền</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-row">
          <span>Tổng tiền hàng:</span>
          <span>${formatMoney(order.totalAmount)}đ</span>
        </div>
        <div class="total-row total-main">
          <span>💰 TỔNG CỘNG:</span>
          <span>${formatMoney(order.totalAmount)}đ</span>
        </div>
      </div>

      <div class="footer">
        <p>Cảm ơn quý khách!</p>
        <p>Hẹn gặp lại 🙏</p>
      </div>
    </body>
    </html>
  `;
};

export const printInvoice = async (order: Order, shopName?: string) => {
  try {
    const html = generateInvoiceHTML(order, shopName);
    await Print.printAsync({ html });
    return { success: true };
  } catch (error) {
    console.error('Print error:', error);
    return { success: false, error };
  }
};

export const shareInvoicePDF = async (order: Order, shopName?: string) => {
  try {
    const html = generateInvoiceHTML(order, shopName);
    const { uri } = await Print.printToFileAsync({ html });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Hóa đơn #${order.id.slice(-6).toUpperCase()}`,
      });
      return { success: true, uri };
    } else {
      return { success: false, error: 'Sharing not available' };
    }
  } catch (error) {
    console.error('Share PDF error:', error);
    return { success: false, error };
  }
};
