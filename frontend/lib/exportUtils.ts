import * as XLSX from "xlsx";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
} from "docx";
import { ReceiptDto } from "@/types/payment";
import { formatCurrency, formatDate } from "./utils";

/**
 * Sanitizes cell values against CSV/Spreadsheet Formula Injection (OWASP).
 * Prefixes strings starting with =, +, @, Tab, CR (or - when non-numeric) with a single quote.
 */
export function sanitizeSpreadsheetCell(val: string | number | null | undefined): string | number {
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

/**
 * Official Payment Receipt export to Word (.docx) format with corporate branding,
 * itemized settlement breakdown, and authorized signature section.
 */
export async function exportReceiptToWord(receipt: ReceiptDto): Promise<void> {
  const borderNone = {
    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  };

  const borderSubtle = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
  };

  const borderCellBottom = {
    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  };

  // Header Table
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderNone,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: receipt.companyName || "Sepakat Silaturrahim Enterprise",
                    bold: true,
                    size: 26,
                    color: "059669",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "SSEP / SISTEM PENGURUSAN PEKERJA & PENGGAJIAN",
                    bold: true,
                    size: 17,
                    color: "64748B",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "RESIT RASMI BAYARAN / OFFICIAL PAYMENT RECEIPT",
                    bold: true,
                    size: 20,
                    color: "0F172A",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `NO. RESIT: ${receipt.paymentCode}`,
                    bold: true,
                    size: 20,
                    color: "0F172A",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Tarikh: ${formatDate(receipt.paymentDate)}`,
                    size: 18,
                    color: "64748B",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "STATUS: DIBAYAR (PAID)",
                    bold: true,
                    size: 18,
                    color: "059669",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Metadata Table (Employee & Payment info)
  const metadataTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderSubtle,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: "F8FAFC", type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            borders: borderSubtle,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "DIBAYAR KEPADA / PAYEE",
                    bold: true,
                    size: 17,
                    color: "475569",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Nama Pekerja: ", bold: true, size: 18, color: "334155" }),
                  new TextRun({ text: receipt.employeeName, bold: true, size: 19, color: "0F172A" }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Kod Pekerja: ", bold: true, size: 18, color: "334155" }),
                  new TextRun({ text: receipt.employeeCode || "-", size: 18, color: "0F172A" }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: "F8FAFC", type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            borders: borderSubtle,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "MAKLUMAT BAYARAN / PAYMENT INFO",
                    bold: true,
                    size: 17,
                    color: "475569",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Kaedah: ", bold: true, size: 18, color: "334155" }),
                  new TextRun({ text: receipt.paymentMethod || "CASH", bold: true, size: 18, color: "0F172A" }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Rujukan: ", bold: true, size: 18, color: "334155" }),
                  new TextRun({ text: receipt.reference || "-", size: 18, color: "0F172A" }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Catatan: ", bold: true, size: 18, color: "334155" }),
                  new TextRun({ text: receipt.notes || "-", size: 18, color: "0F172A" }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Items Table Header
  const tableHeaderRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        shading: { fill: "059669", type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "No.", bold: true, size: 17, color: "FFFFFF" })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 24, type: WidthType.PERCENTAGE },
        shading: { fill: "059669", type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Tarikh Kerja", bold: true, size: 17, color: "FFFFFF" })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 24, type: WidthType.PERCENTAGE },
        shading: { fill: "059669", type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Kadar Asas (RM)", bold: true, size: 17, color: "FFFFFF" })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 24, type: WidthType.PERCENTAGE },
        shading: { fill: "059669", type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Amaun Bayaran (RM)", bold: true, size: 17, color: "FFFFFF" })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 20, type: WidthType.PERCENTAGE },
        shading: { fill: "059669", type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Status", bold: true, size: 17, color: "FFFFFF" })],
          }),
        ],
      }),
    ],
  });

  // Items Table Rows
  const itemRows =
    receipt.items && receipt.items.length > 0
      ? receipt.items.map((item, index) => {
          const isEven = index % 2 === 0;
          const bgShading = isEven
            ? undefined
            : { fill: "F8FAFC", type: ShadingType.CLEAR, color: "auto" };
          return new TableRow({
            children: [
              new TableCell({
                width: { size: 8, type: WidthType.PERCENTAGE },
                shading: bgShading,
                borders: borderCellBottom,
                margins: { top: 100, bottom: 100, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: String(index + 1), size: 18, color: "475569" })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 24, type: WidthType.PERCENTAGE },
                shading: bgShading,
                borders: borderCellBottom,
                margins: { top: 100, bottom: 100, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: formatDate(item.workDate), size: 18, color: "0F172A" })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 24, type: WidthType.PERCENTAGE },
                shading: bgShading,
                borders: borderCellBottom,
                margins: { top: 100, bottom: 100, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: Number(item.dailyRate).toFixed(2),
                        size: 18,
                        color: "334155",
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 24, type: WidthType.PERCENTAGE },
                shading: bgShading,
                borders: borderCellBottom,
                margins: { top: 100, bottom: 100, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: Number(item.amountApplied).toFixed(2),
                        bold: true,
                        size: 18,
                        color: "0F172A",
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                shading: bgShading,
                borders: borderCellBottom,
                margins: { top: 100, bottom: 100, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: item.workRecordStatus || "PAID",
                        bold: true,
                        size: 17,
                        color: "059669",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          });
        })
      : [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnSpan: 5,
                borders: borderCellBottom,
                margins: { top: 140, bottom: 140, left: 140, right: 140 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Bayaran diagihkan ke atas baki tertunggak pekerja.",
                        italics: true,
                        size: 18,
                        color: "64748B",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ];

  const itemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderNone,
    rows: [tableHeaderRow, ...itemRows],
  });

  // Grand Total Banner Table
  const totalTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: "10B981" },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: "10B981" },
      left: { style: BorderStyle.SINGLE, size: 8, color: "10B981" },
      right: { style: BorderStyle.SINGLE, size: 8, color: "10B981" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            shading: { fill: "ECFDF5", type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "JUMLAH KESELURUHAN DIBAYAR",
                    bold: true,
                    size: 19,
                    color: "065F46",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Status: Penyelesaian Bayaran Selesai (PAID)",
                    size: 16,
                    color: "047857",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            shading: { fill: "ECFDF5", type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: formatCurrency(receipt.totalAmount),
                    bold: true,
                    size: 28,
                    color: "047857",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Signature Block
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderNone,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: borderNone,
            margins: { top: 240, bottom: 100, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "___________________________________", color: "94A3B8" })],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Tandatangan Majikan / Pengurus",
                    bold: true,
                    size: 17,
                    color: "475569",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: receipt.companyName || "Sepakat Silaturrahim Enterprise",
                    size: 16,
                    color: "64748B",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: borderNone,
            margins: { top: 240, bottom: 100, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "___________________________________", color: "94A3B8" })],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Tandatangan Penerima",
                    bold: true,
                    size: 17,
                    color: "475569",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: receipt.employeeName,
                    size: 16,
                    color: "64748B",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
          },
        },
        children: [
          headerTable,
          new Paragraph({ spacing: { after: 180 } }),
          metadataTable,
          new Paragraph({
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: "PERINCIAN REKOD KERJA DISELESAIKAN (FIFO)",
                bold: true,
                size: 18,
                color: "1E293B",
              }),
            ],
          }),
          itemsTable,
          new Paragraph({ spacing: { after: 180 } }),
          totalTable,
          new Paragraph({ spacing: { after: 240 } }),
          signatureTable,
          new Paragraph({
            spacing: { before: 280 },
            children: [
              new TextRun({
                text: "Resit janaan komputer - Sepakat Silaturrahim Enterprise. Tandatangan digital sah.",
                size: 15,
                color: "94A3B8",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Resit-${receipt.paymentCode}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Official Payment Receipt export to Excel (.xlsx) format with corporate header,
 * sanitized spreadsheet cells, itemized settled work records, and totals.
 */
export function exportReceiptToExcel(receipt: ReceiptDto): void {
  const company = receipt.companyName || "Sepakat Silaturrahim Enterprise";
  const rows: (string | number)[][] = [
    [company],
    ["SSEP / SISTEM PENGURUSAN PEKERJA & PENGGAJIAN"],
    ["RESIT RASMI BAYARAN / OFFICIAL PAYMENT RECEIPT"],
    [],
    ["No. Resit:", receipt.paymentCode, "", "Tarikh Bayaran:", formatDate(receipt.paymentDate)],
    ["Kod Pekerja:", receipt.employeeCode || "-", "", "Kaedah Bayaran:", receipt.paymentMethod || "CASH"],
    ["Nama Pekerja:", receipt.employeeName, "", "Rujukan:", receipt.reference || "-"],
    ["Catatan:", receipt.notes || "-", "", "Status:", receipt.status || "PAID"],
    [],
    ["No.", "Tarikh Kerja", "Kadar Asas (RM)", "Amaun Bayaran (RM)", "Status"],
  ];

  if (receipt.items && receipt.items.length > 0) {
    receipt.items.forEach((item, index) => {
      rows.push([
        index + 1,
        formatDate(item.workDate),
        Number(item.dailyRate) || 0,
        Number(item.amountApplied) || 0,
        item.workRecordStatus || "PAID",
      ]);
    });
  } else {
    rows.push([
      "-",
      "Bayaran diagihkan ke atas baki tertunggak pekerja.",
      "-",
      Number(receipt.totalAmount) || 0,
      "PAID",
    ]);
  }

  rows.push([]);
  rows.push([
    "",
    "",
    "JUMLAH KESELURUHAN DIBAYAR (RM):",
    Number(receipt.totalAmount) || 0,
    "PAID",
  ]);
  rows.push([]);
  rows.push([
    "Resit janaan komputer - Sepakat Silaturrahim Enterprise. Tandatangan digital sah.",
  ]);

  const sanitizedRows = rows.map((r) =>
    r.map((cell) => sanitizeSpreadsheetCell(cell))
  );

  const worksheet = XLSX.utils.aoa_to_sheet(sanitizedRows);

  worksheet["!cols"] = [
    { wch: 10 },
    { wch: 28 },
    { wch: 25 },
    { wch: 25 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Resit");
  XLSX.writeFile(workbook, `Resit-${receipt.paymentCode}.xlsx`);
}
