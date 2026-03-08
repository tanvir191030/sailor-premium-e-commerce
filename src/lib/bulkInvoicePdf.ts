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

  const brandColor = "#064E3B";
  const brandLight = "#ECFDF5";
  const brandMedium = "#D1FAE5";

  // Cover page
  const coverPage = `
    <div style="page-break-after:always;padding:60px 40px;text-align:center">
      <div style="background:${brandColor};color:#fff;padding:32px 40px;border-radius:12px;margin-bottom:40px">
        <h1 style="font-size:28px;margin:0 0 6px;letter-spacing:1px">${storeName.toUpperCase()}</h1>
        <p style="font-size:12px;opacity:0.7;letter-spacing:1px;text-transform:uppercase">Verified Invoice Summary</p>
      </div>
      <div style="text-align:left;max-width:500px;margin:0 auto">
        <table style="width:100%;font-size:15px;border-collapse:collapse">
          <tr><td style="padding:12px 0;color:#666;border-bottom:1px solid #eee">📅 তারিখ</td><td style="padding:12px 0;font-weight:700;text-align:right;border-bottom:1px solid #eee">${displayDate}</td></tr>
          <tr><td style="padding:12px 0;color:#666;border-bottom:1px solid #eee">📦 মোট অর্ডার</td><td style="padding:12px 0;font-weight:700;text-align:right;border-bottom:1px solid #eee">${orders.length} টি</td></tr>
          <tr><td style="padding:12px 0;color:#666;border-bottom:1px solid #eee">🚚 ডেলিভারি চার্জ</td><td style="padding:12px 0;font-weight:700;text-align:right;border-bottom:1px solid #eee">BDT ${totalDelivery.toLocaleString()}</td></tr>
          <tr><td style="padding:12px 0;color:#666">💰 মোট আদায়যোগ্য</td><td style="padding:12px 0;font-weight:700;font-size:20px;color:${brandColor};text-align:right">BDT ${totalAmount.toLocaleString()}</td></tr>
        </table>
      </div>
      <div style="margin-top:40px">
        <h3 style="font-size:14px;color:#333;margin-bottom:16px;text-align:left">অর্ডার তালিকা:</h3>
        <table style="width:100%;font-size:12px;border-collapse:collapse;text-align:left">
          <thead><tr style="background:${brandColor};color:#fff">
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

  // Generate compact invoice HTML for 2-per-page layout
  const generateCompactInvoice = (order: BulkOrder): string => {
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
    const dueAmount = Math.max(0, order.total - paidAmount);
    const paymentBadgeLabel = isCOD ? "COD" : paidAmount >= order.total ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID";
    const paymentBadgeColor = isCOD ? "#D97706" : paidAmount >= order.total ? "#059669" : paidAmount > 0 ? "#2563EB" : "#DC2626";
    const statusColor = order.status?.toLowerCase() === "delivered" ? "#059669" : order.status?.toLowerCase() === "pending" ? "#D97706" : order.status?.toLowerCase() === "cancelled" ? "#DC2626" : "#6B7280";

    const txnInfo = order.transaction_id ? ` · TxnID: ${order.transaction_id}` : "";
    const qrUrl = websiteUrl ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(websiteUrl)}&color=064E3B" style="width:50px;height:50px;display:block;margin:0 auto" />` : "";

    return `
      <div class="compact-invoice">
        <!-- Header -->
        <div style="background:${brandColor};padding:10px 16px;text-align:center">
          <div style="color:#fff;font-size:14px;font-weight:700;letter-spacing:1px">${storeName.toUpperCase()}</div>
          <div style="color:rgba(255,255,255,0.6);font-size:8px;letter-spacing:0.5px">INVOICE / MEMO</div>
        </div>
        <div style="height:2px;background:linear-gradient(90deg,#047857,${brandColor},#047857)"></div>

        <!-- Meta row -->
        <div style="display:flex;justify-content:space-between;padding:8px 16px;font-size:9px;color:#555;border-bottom:1px solid #f0f0f0">
          <div>
            <div><b>Order:</b> #${order.id.slice(0, 8)}</div>
            <div><b>Date:</b> ${new Date(order.created_at).toLocaleDateString("en-GB")}</div>
            <span style="display:inline-block;padding:1px 6px;border-radius:10px;font-size:7px;font-weight:700;color:#fff;background:${paymentBadgeColor};margin-top:3px">${paymentBadgeLabel}</span>
          </div>
          <div style="text-align:right">
            <div>Status: <span style="display:inline-block;padding:1px 6px;border-radius:10px;font-size:7px;font-weight:600;color:#fff;background:${statusColor}">${(order.status || "pending").toUpperCase()}</span></div>
            <div style="margin-top:2px"><b>Pay:</b> ${order.payment_method}${txnInfo}</div>
            ${order.is_payment_verified ? `<div style="color:#059669;font-size:8px;font-weight:600;margin-top:2px">✅ Verified</div>` : ""}
          </div>
        </div>

        <!-- Customer -->
        <div style="background:${brandLight};border-left:3px solid ${brandColor};padding:7px 12px;margin:8px 16px;border-radius:0 6px 6px 0">
          <div style="font-size:8px;font-weight:700;color:${brandColor};text-transform:uppercase;margin-bottom:3px">Customer</div>
          <div style="font-size:9px;color:#333;line-height:1.6">
            <b>${order.customer_name}</b> · 📞 ${order.phone}<br/>📍 ${order.address}
          </div>
        </div>

        <!-- Items Table -->
        <table style="width:calc(100% - 32px);margin:6px 16px;border-collapse:collapse;font-size:9px;border-radius:4px;overflow:hidden">
          <thead><tr style="background:${brandColor};color:#fff">
            <th style="text-align:left;padding:5px 8px;font-size:8px">Item</th>
            <th style="text-align:center;padding:5px 4px;font-size:8px;width:30px">Qty</th>
            <th style="text-align:right;padding:5px 8px;font-size:8px;width:60px">Price</th>
            <th style="text-align:right;padding:5px 8px;font-size:8px;width:65px">Total</th>
          </tr></thead>
          <tbody>
            ${items.map((item: any, idx: number) => {
              const nm = item.name || "Item";
              const qty = item.quantity || 1;
              const pr = item.price || 0;
              const sz = item.size ? ` (${item.size})` : "";
              return `<tr style="background:${idx % 2 === 0 ? '#fff' : '#f9fafb'}">
                <td style="padding:4px 8px;border-bottom:1px solid #f0f0f0">${nm}${sz}</td>
                <td style="padding:4px 4px;text-align:center;border-bottom:1px solid #f0f0f0">${qty}</td>
                <td style="padding:4px 8px;text-align:right;border-bottom:1px solid #f0f0f0">${pr.toLocaleString()}</td>
                <td style="padding:4px 8px;text-align:right;border-bottom:1px solid #f0f0f0;font-weight:600">${(pr * qty).toLocaleString()}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>

        <!-- Summary -->
        <div style="padding:0 16px;font-size:9px;text-align:right;line-height:1.8">
          <div>Subtotal: BDT ${subtotal.toLocaleString()}</div>
          ${discountAmount > 0 && order.coupon_code ? `<div style="color:#e11d48">Coupon (${order.coupon_code}): -BDT ${discountAmount.toLocaleString()}</div>` : ""}
          <div>Delivery: BDT ${deliveryCharge.toLocaleString()}</div>
          ${paidAmount > 0 ? `<div style="color:#059669">Advance: -BDT ${paidAmount.toLocaleString()}</div>` : ""}
        </div>

        <!-- Grand Total -->
        <div style="margin:6px 16px;padding:8px 12px;background:${brandColor};border-radius:6px;text-align:right;color:#fff;font-size:14px;font-weight:700">
          Total: BDT ${order.total.toLocaleString()}
        </div>

        ${paidAmount > 0 ? `<div style="margin:4px 16px;padding:5px 10px;background:${brandLight};border:1px solid ${brandMedium};border-radius:6px;text-align:right;color:#059669;font-size:9px;font-weight:600">✅ Advance: BDT ${paidAmount.toLocaleString()}</div>` : ""}
        ${!isCOD && paidAmount > 0 && dueAmount > 0 ? `<div style="margin:4px 16px;padding:5px 10px;background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;text-align:right;color:#DC2626;font-size:10px;font-weight:700">💰 Due: BDT ${dueAmount.toLocaleString()}</div>` : ""}
        ${isCOD ? `<div style="margin:4px 16px;padding:5px 10px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;text-align:right;color:#D97706;font-size:10px;font-weight:700">💰 COD: BDT ${order.total.toLocaleString()}</div>` : ""}

        ${order.courier_tracking_id ? `<div style="margin:4px 16px;padding:4px 10px;background:${brandLight};border-radius:6px;font-size:8px;color:#333"><b>Courier:</b> ${order.courier_tracking_id}</div>` : ""}

        <!-- Footer -->
        <div style="margin-top:6px;padding:6px 16px;border-top:1px solid ${brandMedium};text-align:center">
          <div style="font-size:9px;color:${brandColor};font-weight:600">🛍 ধন্যবাদ!</div>
          ${qrUrl ? `<div style="margin-top:4px">${qrUrl}</div>` : ""}
        </div>
      </div>
    `;
  };

  // Build 2-per-page layout
  const invoicePages: string[] = [];
  for (let i = 0; i < orders.length; i += 2) {
    const first = generateCompactInvoice(orders[i]);
    const second = orders[i + 1] ? generateCompactInvoice(orders[i + 1]) : "";
    invoicePages.push(`
      <div class="a4-page">
        ${first}
        ${second ? `<div class="page-divider"></div>${second}` : ""}
      </div>
    `);
  }

  const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bulk Invoices - ${displayDate}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans Bengali','Noto Sans',Inter,'Segoe UI',Tahoma,sans-serif;color:#1a1a1a;background:#fff}
.a4-page{max-width:210mm;margin:0 auto;page-break-after:always;padding:8mm 10mm}
.compact-invoice{border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;margin-bottom:0}
.page-divider{border-top:2px dashed #ccc;margin:10px 0;position:relative}
.page-divider::after{content:'✂';position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#fff;padding:0 8px;color:#999;font-size:12px}
.no-print{text-align:center;padding:16px;background:#064E3B;color:#fff}
.no-print button{padding:10px 32px;background:#fff;color:#064E3B;border:none;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer}
@media print{
  body{padding:0}
  .no-print{display:none!important}
  .a4-page{padding:5mm 8mm;page-break-after:always}
  .compact-invoice{border:1px solid #ddd}
  thead tr,tbody tr:nth-child(even){-webkit-print-color-adjust:exact;print-color-adjust:exact}
  [style*="background"]{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
</head><body>
<div class="no-print">
  <button onclick="window.print()">🖨️ প্রিন্ট / PDF ডাউনলোড</button>
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
