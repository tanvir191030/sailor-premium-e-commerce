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
  const qrSection = data.websiteUrl
    ? `<div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #eee">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(data.websiteUrl)}" alt="QR Code" style="width:120px;height:120px" />
        <p style="font-size:11px;color:#888;margin-top:6px">${data.websiteUrl}</p>
      </div>`
    : "";

  const txnInfo = data.transactionId ? ` (TxnID: ${data.transactionId})` : "";
  const courierInfo = data.courierTrackingId
    ? `<p style="font-size:12px;margin-top:16px;color:#555">Courier Tracking: ${data.courierTrackingId}</p>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice - ${data.orderId.slice(0, 8)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans Bengali','Noto Sans',Inter,'Segoe UI',Tahoma,sans-serif;padding:40px;color:#111;max-width:800px;margin:auto;line-height:1.5}
h1{font-size:26px;font-weight:700;margin-bottom:4px;letter-spacing:-0.5px}
.subtitle{font-size:13px;color:#666;margin-bottom:16px}
.line{border-top:2px solid #222;margin:12px 0 20px}
.meta{display:flex;justify-content:space-between;font-size:13px;line-height:1.8}
.section-title{font-size:15px;font-weight:600;margin:20px 0 8px}
.detail{font-size:13px;line-height:1.8;padding-left:12px}
table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}
th{background:#f5f5f5;text-align:left;padding:10px 14px;border-bottom:2px solid #ddd;font-weight:600}
td{padding:10px 14px;border-bottom:1px solid #eee}
th:nth-child(2),td:nth-child(2){text-align:center;width:60px}
th:nth-child(3),td:nth-child(3){text-align:right;width:100px}
th:nth-child(4),td:nth-child(4){text-align:right;width:100px}
.total-row{text-align:right;font-size:13px;margin-top:14px;line-height:2}
.grand-total{font-size:20px;font-weight:700;text-align:right;margin-top:8px}
@media print{body{padding:20px}button{display:none!important}}
</style>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
</head><body>
<h1>${data.storeName}</h1>
<div class="subtitle">Invoice / Memo</div>
<div class="line"></div>
<div class="meta">
  <div>
    <div>Order ID: #${data.orderId.slice(0, 8)}</div>
    <div>Date: ${data.date}</div>
  </div>
  <div style="text-align:right">
    <div>Status: ${data.status}</div>
    <div>Payment: ${data.paymentMethod}${txnInfo}</div>
  </div>
</div>
<div class="section-title">Customer Details:</div>
<div class="detail">
  Name: ${data.customerName}<br>
  Phone: ${data.phone}<br>
  Address: ${data.address}
</div>
<table>
  <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
  <tbody>
    ${data.items.map((item) => {
      const name = item.name || "Item";
      const qty = item.quantity || 1;
      const price = item.price || 0;
      const sizeLabel = item.size ? ` (${item.size})` : "";
      return `<tr><td>${name}${sizeLabel}</td><td>${qty}</td><td>BDT ${price}</td><td>BDT ${price * qty}</td></tr>`;
    }).join("")}
  </tbody>
</table>
<div class="total-row">Subtotal: BDT ${data.subtotal}<br>Delivery: BDT ${data.deliveryCharge}</div>
<div class="grand-total">Total: BDT ${data.total}</div>
${courierInfo}
${qrSection}
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;
}
