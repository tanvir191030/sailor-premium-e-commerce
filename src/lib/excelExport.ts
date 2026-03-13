import ExcelJS from "exceljs";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1B4332" },
};
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
const ZEBRA_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF0F4F0" },
};
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD0D0D0" } },
  bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
  left: { style: "thin", color: { argb: "FFD0D0D0" } },
  right: { style: "thin", color: { argb: "FFD0D0D0" } },
};

function styleSheet(ws: ExcelJS.Worksheet) {
  const headerRow = ws.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = THIN_BORDER;
  });
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    row.eachCell((cell) => {
      cell.border = THIN_BORDER;
      if (r % 2 === 0) cell.fill = ZEBRA_FILL;
    });
  }
}

async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export rows (array of objects) to a styled xlsx file */
export async function exportJsonToExcel(rows: Record<string, any>[], sheetName: string, filename: string) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  ws.columns = keys.map((k) => ({
    header: k,
    key: k,
    width: Math.max(k.length + 2, ...rows.map((r) => String(r[k] ?? "").length + 2)),
  }));
  rows.forEach((r) => ws.addRow(r));
  styleSheet(ws);
  await downloadWorkbook(wb, filename);
}

/** Export multiple sheets */
export async function exportMultiSheetExcel(
  sheets: { name: string; rows: Record<string, any>[] }[],
  filename: string
) {
  const wb = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name);
    if (sheet.rows.length === 0) continue;
    const keys = Object.keys(sheet.rows[0]);
    ws.columns = keys.map((k) => ({
      header: k,
      key: k,
      width: Math.max(k.length + 2, ...sheet.rows.map((r) => String(r[k] ?? "").length + 2)),
    }));
    sheet.rows.forEach((r) => ws.addRow(r));
    styleSheet(ws);
  }
  await downloadWorkbook(wb, filename);
}

/** Export array-of-arrays (headers + rows) */
export async function exportAoaToExcel(headers: string[], rows: (string | number)[][], sheetName: string, filename: string) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.columns = headers.map((h, i) => ({
    header: h,
    key: h,
    width: Math.max(h.length + 2, ...rows.map((r) => String(r[i] ?? "").length + 2)),
  }));
  rows.forEach((r) => {
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => { obj[h] = r[i]; });
    ws.addRow(obj);
  });
  styleSheet(ws);
  await downloadWorkbook(wb, filename);
}
