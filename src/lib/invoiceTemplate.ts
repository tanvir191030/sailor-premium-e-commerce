interface InvoiceData {
  storeName: string;
  websiteUrl: string;
  orderId: string;
  date: string;
  status: string;
  paymentMethod: string;
  transactionId: string;
  customerName: string;
  phone: string;
  address: string;
  items: Array<{ name?: string; quantity?: number; price?: number; size?: string }>;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  courierTrackingId?: string;
  couponCode?: string;
  discountAmount?: number;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const brandColor = "#064E3B";
  const brandLight = "#ECFDF5";
  const brandMedium = "#D1FAE5";
  const accentColor = "#047857";

  const qrSection = data.websiteUrl
    ? `<div style="text-align:center;margin-top:32px;padding-top:24px">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(data.websiteUrl)}&color=064E3B" alt="QR Code" style="width:110px;height:110px" />
        <p style="font-size:10px;color:#888;margin-top:6px;letter-spacing:0.5px">${data.websiteUrl}</p>
      </div>`
    : "";

  const txnInfo = data.transactionId ? ` (TxnID: ${data.transactionId})` : "";
  const courierInfo = data.courierTrackingId
    ? `<div style="margin-top:16px;padding:10px 16px;background:${brandLight};border-radius:8px;font-size:12px;color:#333">
        <strong>Courier Tracking:</strong> ${data.courierTrackingId}
      </div>`
    : "";

  const statusColor = data.status?.toLowerCase() === "delivered" ? "#059669"
    : data.status?.toLowerCase() === "pending" ? "#D97706"
    : data.status?.toLowerCase() === "cancelled" ? "#DC2626" : "#6B7280";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice - ${data.orderId.slice(0, 8)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans Bengali','Noto Sans',Inter,'Segoe UI',Tahoma,sans-serif;color:#1a1a1a;max-width:800px;margin:auto;line-height:1.6;background:#fff}
.invoice-wrap{padding:0}
.header{background:${brandColor};padding:28px 40px 24px;text-align:center;position:relative}
.header h1{color:#fff;font-size:24px;font-weight:700;letter-spacing:1.5px;margin-bottom:4px}
.header .tagline{color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:1px;text-transform:uppercase}
.header-accent{height:4px;background:linear-gradient(90deg,${accentColor},${brandColor},${accentColor})}
.order-meta{display:flex;justify-content:space-between;align-items:flex-start;padding:20px 40px;font-size:12px;color:#555;border-bottom:1px solid #f0f0f0}
.order-meta .left div,.order-meta .right div{margin-bottom:3px}
.order-meta .right{text-align:right}
.status-badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;color:#fff;letter-spacing:0.3px}
.content{padding:0 40px 40px}
.customer-box{background:${brandLight};border-left:4px solid ${brandColor};border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0}
.customer-box .label{font-size:13px;font-weight:700;color:${brandColor};margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px}
.customer-box .detail{font-size:13px;color:#333;line-height:1.9}
table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px;border-radius:8px;overflow:hidden}
thead tr{background:${brandColor};color:#fff}
th{text-align:left;padding:11px 16px;font-weight:600;font-size:12px;letter-spacing:0.3px}
td{padding:11px 16px;border-bottom:1px solid #f0f0f0;color:#333}
tbody tr:nth-child(even){background:#f9fafb}
tbody tr:nth-child(odd){background:#fff}
th:nth-child(2),td:nth-child(2){text-align:center;width:60px}
th:nth-child(3),td:nth-child(3){text-align:right;width:100px}
th:nth-child(4),td:nth-child(4){text-align:right;width:110px}
.summary{margin-top:20px;text-align:right;font-size:13px;line-height:2.2}
.summary .row{display:flex;justify-content:flex-end;gap:20px}
.summary .row .lbl{color:#777;min-width:100px;text-align:right}
.summary .row .val{min-width:100px;text-align:right;font-weight:500}
.grand-total-box{margin-top:12px;padding:14px 20px;background:${brandColor};border-radius:8px;text-align:right;color:#fff;font-size:20px;font-weight:700;letter-spacing:0.3px}
.footer{margin-top:32px;padding-top:20px;border-top:2px solid ${brandMedium};text-align:center}
.footer .thanks{font-size:14px;color:${brandColor};font-weight:600;margin-bottom:4px}
.footer .sub{font-size:11px;color:#999}
@media print{body{padding:0}.invoice-wrap{padding:0}.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}thead tr{-webkit-print-color-adjust:exact;print-color-adjust:exact}tbody tr:nth-child(even){-webkit-print-color-adjust:exact;print-color-adjust:exact}.grand-total-box{-webkit-print-color-adjust:exact;print-color-adjust:exact}.customer-box{-webkit-print-color-adjust:exact;print-color-adjust:exact}.status-badge{-webkit-print-color-adjust:exact;print-color-adjust:exact}button{display:none!important}}
</style>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
</head><body>
<div class="invoice-wrap">
  <!-- Header -->
  <div class="header">
    <h1>${data.storeName.toUpperCase()}</h1>
    <div class="tagline">Invoice / Memo</div>
  </div>
  <div class="header-accent"></div>

  <!-- Order Meta -->
  <div class="order-meta">
    <div class="left">
      <div><strong>Order ID:</strong> #${data.orderId.slice(0, 8)}</div>
      <div><strong>Date:</strong> ${data.date}</div>
    </div>
    <div class="right">
      <div>Status: <span class="status-badge" style="background:${statusColor}">${data.status.toUpperCase()}</span></div>
      <div style="margin-top:6px"><strong>Payment:</strong> ${data.paymentMethod}${txnInfo}</div>
    </div>
  </div>

  <div class="content">
    <!-- Customer -->
    <div class="customer-box">
      <div class="label">Customer Details</div>
      <div class="detail">
        <strong>Name:</strong> ${data.customerName}<br>
        <strong>Phone:</strong> ${data.phone}<br>
        <strong>Address:</strong> ${data.address}
      </div>
    </div>

    <!-- Items Table -->
    <table>
      <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>
        ${data.items.map((item) => {
          const name = item.name || "Item";
          const qty = item.quantity || 1;
          const price = item.price || 0;
          const sizeLabel = item.size ? ` <span style="color:#888;font-size:11px">(${item.size})</span>` : "";
          return `<tr><td>${name}${sizeLabel}</td><td>${qty}</td><td>BDT ${price.toLocaleString()}</td><td><strong>BDT ${(price * qty).toLocaleString()}</strong></td></tr>`;
        }).join("")}
      </tbody>
    </table>

    <!-- Summary -->
    <div class="summary">
      <div class="row"><span class="lbl">Subtotal:</span><span class="val">BDT ${data.subtotal.toLocaleString()}</span></div>
      ${data.couponCode && data.discountAmount ? `<div class="row"><span class="lbl" style="color:#e11d48">Coupon (${data.couponCode}):</span><span class="val" style="color:#e11d48">-BDT ${data.discountAmount.toLocaleString()}</span></div>` : ""}
      <div class="row"><span class="lbl">Delivery:</span><span class="val">BDT ${data.deliveryCharge.toLocaleString()}</span></div>
    </div>

    <div class="grand-total-box">Total: BDT ${data.total.toLocaleString()}</div>

    ${courierInfo}

    <!-- Footer -->
    <div class="footer">
      <div class="thanks">🛍 ধন্যবাদ! আপনার অর্ডারের জন্য কৃতজ্ঞ।</div>
      <div class="sub">Thank you for shopping with ${data.storeName}</div>
      ${qrSection}
    </div>
  </div>
</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;
}
