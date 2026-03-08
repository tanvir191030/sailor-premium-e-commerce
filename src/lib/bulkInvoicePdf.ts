import { generateInvoiceHTML } from "./invoiceTemplate";

interface BulkOrder {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  total: number;
  delivery_charge: number;
  discount_amount: number;
  cart_items: any[];
  payment_method: string;
  transaction_id: string;
  status: string;
  created_at: string;
  courier_tracking_id?: string;
  coupon_code?: string;
  is_payment_verified?: boolean;
}

export function openBulkInvoicesInNewTab(
  orders: BulkOrder[],
  storeName: string,
  websiteUrl: string,
  dateLabel?: string
) {
  if (orders.length === 0) return;

  const displayDate = dateLabel || new Date().toLocaleDateString("en-GB");
  const totalAmount = orders.reduce((s, o) => s + Number(o.total), 0);
  const totalDelivery = orders.reduce((s, o) => s + Number(o.delivery_charge || 0), 0);

  const coverPage = `
    <div style="page-break-after:always;padding:60px 40px;font-family:'Noto Sans Bengali','Noto Sans',Inter,sans-serif;text-align:center">
      <div style="background:#064E3B;color:#fff;padding:32px 40px;border-radius:12px;margin-bottom:40px">
        <h1 style="font-size:28px;margin:0 0 6px;letter-spacing:1px">${storeName.toUpperCase()}</h1>
        <p style="font-size:12px;opacity:0.7;letter-spacing:1px;text-transform:uppercase">Verified Invoice Summary</p>
      </div>
      <div style="text-align:left;max-width:500px;margin:0 auto">
        <table style="width:100%;font-size:15px;border-collapse:collapse">
          <tr><td style="padding:12px 0;color:#666;border-bottom:1px solid #eee">📅 তারিখ</td><td style="padding:12px 0;font-weight:700;text-align:right;border-bottom:1px solid #eee">${displayDate}</td></tr>
          <tr><td style="padding:12px 0;color:#666;border-bottom:1px solid #eee">📦 মোট অর্ডার</td><td style="padding:12px 0;font-weight:700;text-align:right;border-bottom:1px solid #eee">${orders.length} টি</td></tr>
          <tr><td style="padding:12px 0;color:#666;border-bottom:1px solid #eee">🚚 মোট ডেলিভারি চার্জ</td><td style="padding:12px 0;font-weight:700;text-align:right;border-bottom:1px solid #eee">BDT ${totalDelivery.toLocaleString()}</td></tr>
          <tr><td style="padding:12px 0;color:#666">💰 মোট আদায়যোগ্য</td><td style="padding:12px 0;font-weight:700;font-size:20px;color:#064E3B;text-align:right">BDT ${totalAmount.toLocaleString()}</td></tr>
        </table>
      </div>
      <div style="margin-top:40px">
        <h3 style="font-size:14px;color:#333;margin-bottom:16px;text-align:left">অর্ডার তালিকা:</h3>
        <table style="width:100%;font-size:12px;border-collapse:collapse;text-align:left">
          <thead><tr style="background:#064E3B;color:#fff">
            <th style="padding:8px 12px;border-radius:6px 0 0 0">#</th>
            <th style="padding:8px 12px">Order ID</th>
            <th style="padding:8px 12px">কাস্টমার</th>
            <th style="padding:8px 12px">ফোন</th>
            <th style="padding:8px 12px;text-align:right;border-radius:0 6px 0 0">মোট</th>
          </tr></thead>
          <tbody>
            ${orders.map((o, i) => `<tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
              <td style="padding:8px 12px">${i + 1}</td>
              <td style="padding:8px 12px;font-family:monospace">#${o.id.slice(0, 8)}</td>
              <td style="padding:8px 12px">${o.customer_name}</td>
              <td style="padding:8px 12px">${o.phone}</td>
              <td style="padding:8px 12px;text-align:right;font-weight:600">BDT ${Number(o.total).toLocaleString()}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Generate individual invoices — extract body content with styles preserved
  const invoicePages = orders.map((order) => {
    const items = Array.isArray(order.cart_items) ? order.cart_items : [];
    const deliveryCharge = order.delivery_charge ?? 0;
    const discountAmount = order.discount_amount ?? 0;
    const subtotal = order.total + discountAmount - deliveryCharge;
    const isCOD = order.payment_method === "Cash on Delivery";
    const hasAdvance = !isCOD && order.transaction_id;
    let paidAmount = 0;
    if (hasAdvance) {
      const dc = order.delivery_charge ?? 0;
      paidAmount = (dc > 0 && dc < order.total) ? dc : order.total;
    }

    const html = generateInvoiceHTML({
      storeName,
      websiteUrl,
      orderId: order.id,
      date: new Date(order.created_at).toLocaleDateString("en-GB"),
      status: (order.status || "pending").toUpperCase(),
      paymentMethod: order.payment_method || "Cash on Delivery",
      transactionId: order.transaction_id || "",
      customerName: order.customer_name,
      phone: order.phone,
      address: order.address,
      items,
      subtotal,
      deliveryCharge,
      total: order.total,
      courierTrackingId: order.courier_tracking_id || "",
      couponCode: order.coupon_code || "",
      discountAmount,
      paidAmount,
      isPaymentVerified: order.is_payment_verified ?? false,
    });

    // Extract body content, remove auto-print script
    const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
    const bodyContent = bodyMatch ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "") : "";
    return `<div style="page-break-before:always">${bodyContent}</div>`;
  });

  const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bulk Invoices - ${displayDate}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans Bengali','Noto Sans',Inter,'Segoe UI',Tahoma,sans-serif;color:#1a1a1a;max-width:800px;margin:auto;line-height:1.6;background:#fff}
.invoice-wrap{padding:0}
.header{background:#064E3B;padding:28px 40px 24px;text-align:center}
.header h1{color:#fff;font-size:24px;font-weight:700;letter-spacing:1.5px;margin-bottom:4px}
.header .tagline{color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:1px;text-transform:uppercase}
.header-accent{height:4px;background:linear-gradient(90deg,#047857,#064E3B,#047857)}
.order-meta{display:flex;justify-content:space-between;align-items:flex-start;padding:20px 40px;font-size:12px;color:#555;border-bottom:1px solid #f0f0f0}
.order-meta .left div,.order-meta .right div{margin-bottom:3px}
.order-meta .right{text-align:right}
.status-badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;color:#fff}
.payment-badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:10px;font-weight:700;color:#fff;margin-top:6px}
.content{padding:0 40px 40px}
.customer-box{background:#ECFDF5;border-left:4px solid #064E3B;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0}
.customer-box .label{font-size:13px;font-weight:700;color:#064E3B;margin-bottom:8px;text-transform:uppercase}
.customer-box .detail{font-size:13px;color:#333;line-height:1.9}
table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px;border-radius:8px;overflow:hidden}
thead tr{background:#064E3B;color:#fff}
th{text-align:left;padding:11px 16px;font-weight:600;font-size:12px}
td{padding:11px 16px;border-bottom:1px solid #f0f0f0;color:#333}
tbody tr:nth-child(even){background:#f9fafb}
tbody tr:nth-child(odd){background:#fff}
th:nth-child(2),td:nth-child(2){text-align:center;width:60px}
th:nth-child(3),td:nth-child(3){text-align:right;width:100px}
th:nth-child(4),td:nth-child(4){text-align:right;width:110px}
.summary{margin-top:20px;text-align:right;font-size:13px;line-height:2.2}
.summary .row{display:flex;justify-content:flex-end;gap:20px}
.summary .row .lbl{color:#777;min-width:120px;text-align:right}
.summary .row .val{min-width:100px;text-align:right;font-weight:500}
.summary .divider{border-top:1px dashed #ddd;margin:6px 0}
.grand-total-box{margin-top:12px;padding:14px 20px;background:#064E3B;border-radius:8px;text-align:right;color:#fff;font-size:20px;font-weight:700}
.due-box{margin-top:8px;padding:12px 20px;background:#FEF2F2;border:2px solid #FECACA;border-radius:8px;text-align:right;color:#DC2626;font-size:16px;font-weight:700}
.paid-box{margin-top:8px;padding:10px 20px;background:#ECFDF5;border:2px solid #D1FAE5;border-radius:8px;text-align:right;color:#059669;font-size:13px;font-weight:600}
.footer{margin-top:32px;padding-top:20px;border-top:2px solid #D1FAE5;text-align:center}
.footer .thanks{font-size:14px;color:#064E3B;font-weight:600;margin-bottom:4px}
.footer .sub{font-size:11px;color:#999}
@media print{body{padding:0}thead tr,tbody tr:nth-child(even),.grand-total-box,.due-box,.paid-box,.customer-box,.status-badge,.payment-badge,.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}button,.no-print{display:none!important}}
</style>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
</head><body>
<div class="no-print" style="text-align:center;padding:16px;background:#064E3B;color:#fff">
  <button onclick="window.print()" style="padding:10px 32px;background:#fff;color:#064E3B;border:none;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer">🖨️ প্রিন্ট / PDF ডাউনলোড</button>
  <span style="margin-left:16px;font-size:13px">${orders.length} টি ইনভয়েস · ${displayDate}</span>
</div>
${coverPage}
${invoicePages.join("")}
</body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(fullHTML);
    win.document.close();
  }
}
