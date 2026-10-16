import * as XLSX from "xlsx";

/**
 * Sanitizes cell values against CSV/Spreadsheet Formula Injection (OWASP).
 * Prefixes strings starting with =, +, @, Tab, CR (or - when non-numeric) with a single quote.
 */
function sanitizeSpreadsheetCell(val: string | number | null | undefined): string | number {
  if (val === null || val === undefined) return "";
  if (typeof val === "number") return val;

  const str = String(val);
  if (!str) return "";

  const firstChar = str.charAt(0);
  if (
    firstChar === "=" ||
    firstChar === "+" ||
    firstChar === "@" ||
    firstChar === "\t" ||
    firstChar === "\r" ||
    (firstChar === "-" && str !== "-" && isNaN(Number(str)))
  ) {
    return `'${str}`;
  }
  return str;
}

/**
 * Universal CSV export with UTF-8 BOM so Microsoft Excel and Google Sheets open Malay/special characters correctly.
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCell = (val: string | number | null | undefined): string => {
    const safeVal = sanitizeSpreadsheetCell(val);
    const str = String(safeVal).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(",");
  const dataLines = rows.map((row) => row.map(escapeCell).join(","));
  const csvContent = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Excel (.xlsx) export using xlsx package with auto-calculated column widths and formula injection protection.
 */
export function exportToExcel(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const sanitizedHeaders = headers.map((h) => String(sanitizeSpreadsheetCell(h)));
  const sanitizedRows = rows.map((r) => r.map((cell) => sanitizeSpreadsheetCell(cell)));
  const data = [sanitizedHeaders, ...sanitizedRows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths based on longest text
  const colWidths = sanitizedHeaders.map((h, i) => {
    let max = h.length;
    for (const r of sanitizedRows) {
      const cellVal = String(r[i] ?? "");
      if (cellVal.length > max) max = cellVal.length;
    }
    return { wch: Math.min(Math.max(max + 3, 10), 45) };
  });
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

  const cleanFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, cleanFilename);
}
