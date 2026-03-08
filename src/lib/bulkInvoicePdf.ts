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

  // Cover page
  const coverPage = `
    <div class="cover-page">
      <div style="background:#064E3B;color:#fff;padding:20px 28px;border-radius:8px;margin-bottom:24px;text-align:center">
        <h1 style="font-size:20px;margin:0 0 4px;letter-spacing:1px">${storeName.toUpperCase()}</h1>
        <p style="font-size:10px;opacity:0.7;letter-spacing:1px;text-transform:uppercase">Verified Invoice Summary</p>
      </div>
      <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:16px">
        <tr><td style="padding:8px 0;color:#666;border-bottom:1px solid #eee">📅 তারিখ</td><td style="padding:8px 0;font-weight:700;text-align:right;border-bottom:1px solid #eee">${displayDate}</td></tr>
        <tr><td style="padding:8px 0;color:#666;border-bottom:1px solid #eee">📦 মোট অর্ডার</td><td style="padding:8px 0;font-weight:700;text-align:right;border-bottom:1px solid #eee">${orders.length} টি</td></tr>
        <tr><td style="padding:8px 0;color:#666;border-bottom:1px solid #eee">🚚 ডেলিভারি চার্জ</td><td style="padding:8px 0;font-weight:700;text-align:right;border-bottom:1px solid #eee">BDT ${totalDelivery.toLocaleString()}</td></tr>
        <tr><td style="padding:8px 0;color:#666">💰 মোট আদায়যোগ্য</td><td style="padding:8px 0;font-weight:700;font-size:16px;color:#064E3B;text-align:right">BDT ${totalAmount.toLocaleString()}</td></tr>
      </table>
      <table style="width:100%;font-size:10px;border-collapse:collapse">
        <thead><tr style="background:#064E3B;color:#fff">
          <th style="padding:6px 8px;border-radius:4px 0 0 0;text-align:left">#</th>
          <th style="padding:6px 8px;text-align:left">Order ID</th>
          <th style="padding:6px 8px;text-align:left">কাস্টমার</th>
          <th style="padding:6px 8px;text-align:left">ফোন</th>
          <th style="padding:6px 8px;text-align:right;border-radius:0 4px 0 0">মোট</th>
        </tr></thead>
        <tbody>
          ${orders.map((o, i) => `<tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
            <td style="padding:5px 8px">${i + 1}</td>
            <td style="padding:5px 8px;font-family:monospace">#${o.id.slice(0, 8)}</td>
            <td style="padding:5px 8px">${o.customer_name}</td>
            <td style="padding:5px 8px">${o.phone}</td>
            <td style="padding:5px 8px;text-align:right;font-weight:600">BDT ${Number(o.total).toLocaleString()}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;

  // Generate individual invoices — extract body content
  const invoiceBodies = orders.map((order) => {
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

    const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
    const bodyContent = bodyMatch ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "") : "";
    return bodyContent;
  });

  // Build 2-per-page layout
  const invoicePages: string[] = [];
  for (let i = 0; i < invoiceBodies.length; i += 2) {
    const first = invoiceBodies[i];
    const second = invoiceBodies[i + 1];
    invoicePages.push(`
      <div class="a4-page">
        <div class="half-invoice">${first}</div>
        ${second ? `<div class="half-divider"></div><div class="half-invoice">${second}</div>` : ""}
      </div>
    `);
  }

  const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bulk Invoices - ${displayDate}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans Bengali','Noto Sans',Inter,'Segoe UI',Tahoma,sans-serif;color:#1a1a1a;background:#fff}

/* Print-friendly A4 layout */
.cover-page{max-width:700px;margin:0 auto;padding:30px 28px;page-break-after:always}
.a4-page{max-width:700px;margin:0 auto;padding:10px 16px;page-break-after:always;display:flex;flex-direction:column;min-height:calc(100vh - 20px)}
.half-invoice{flex:1;overflow:hidden;transform-origin:top left}
.half-divider{border-top:1px dashed #ccc;margin:6px 0}

/* Scale down the invoice content to fit half A4 */
.half-invoice .invoice-wrap{transform:scale(0.62);transform-origin:top left;width:161.3%;/* 1/0.62 */}
.half-invoice .header{padding:16px 24px 14px !important}
.half-invoice .header h1{font-size:16px !important}
.half-invoice .header .tagline{font-size:9px !important}
.half-invoice .header-accent{height:2px !important}
.half-invoice .order-meta{padding:10px 24px !important;font-size:10px !important}
.half-invoice .content{padding:0 24px 16px !important}
.half-invoice .customer-box{padding:8px 12px !important;margin:10px 0 !important}
.half-invoice .customer-box .label{font-size:10px !important;margin-bottom:4px !important}
.half-invoice .customer-box .detail{font-size:10px !important;line-height:1.6 !important}
.half-invoice table{margin-top:10px !important;font-size:10px !important}
.half-invoice th{padding:6px 10px !important;font-size:9px !important}
.half-invoice td{padding:6px 10px !important}
.half-invoice .summary{margin-top:10px !important;font-size:10px !important;line-height:1.8 !important}
.half-invoice .grand-total-box{margin-top:6px !important;padding:8px 12px !important;font-size:14px !important}
.half-invoice .due-box,.half-invoice .paid-box{margin-top:4px !important;padding:6px 12px !important;font-size:10px !important}
.half-invoice .footer{margin-top:10px !important;padding-top:8px !important}
.half-invoice .footer .thanks{font-size:10px !important}
.half-invoice .footer .sub{font-size:8px !important}
.half-invoice .footer img{width:60px !important;height:60px !important}
.half-invoice .status-badge{font-size:8px !important;padding:1px 6px !important}
.half-invoice .payment-badge{font-size:7px !important;padding:2px 8px !important}

/* Top bar */
.no-print{text-align:center;padding:12px;background:#064E3B;color:#fff}
.no-print button{padding:8px 24px;background:#fff;color:#064E3B;border:none;border-radius:6px;font-weight:700;font-size:13px;cursor:pointer}

@media print{
  body{padding:0}
  .no-print{display:none!important}
  .a4-page{padding:4mm 6mm;page-break-after:always;min-height:auto}
  .cover-page{padding:10mm}
  thead tr,tbody tr:nth-child(even),.grand-total-box,.due-box,.paid-box,.customer-box,.status-badge,.payment-badge,.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
</head><body>
<div class="no-print">
  <button onclick="window.print()">🖨️ প্রিন্ট / PDF ডাউনলোড</button>
  <span style="margin-left:12px;font-size:12px">${orders.length} টি ইনভয়েস · ${displayDate}</span>
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
