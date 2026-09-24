import { jsPDF } from "jspdf";
import { ReceiptDto } from "@/types/payment";
import { MonthlyReport, OutstandingEmployeeReport, DailyReport } from "@/types/report";
import { formatDate } from "@/lib/utils";

// Dimensions for A4 in mm
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

/**
 * Downloads a payment receipt as a PDF.
 */
export function downloadReceiptPdf(receipt: ReceiptDto): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = MARGIN;

  // Header Background Bar (Emerald)
  doc.setFillColor(5, 150, 105); // Emerald-600
  doc.rect(MARGIN, y, CONTENT_WIDTH, 22, "F");

  // SSE Brand Block
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(MARGIN + 4, y + 3, 16, 16, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(5, 150, 105);
  doc.text("SSE", MARGIN + 12, y + 11, { align: "center" });
  doc.setFontSize(5);
  doc.text("RESIT", MARGIN + 12, y + 15, { align: "center" });

  // Company Name and Subtitle in Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(receipt.companyName || "Sepakat Silaturrahim Enterprise", MARGIN + 24, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(209, 250, 229); // Emerald-100
  doc.text("Sistem Pengurusan Gaji & Kehadiran SSE", MARGIN + 24, y + 15);

  // Receipt Code on the right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(receipt.paymentCode, PAGE_WIDTH - MARGIN - 4, y + 10, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Tarikh: ${receipt.paymentDate}`, PAGE_WIDTH - MARGIN - 4, y + 15, { align: "right" });

  y += 28;

  // Subheader: Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text("RESIT PEMBAYARAN GAJI", MARGIN, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text("Bukti rasmi penyelesaian bayaran gaji bagi rekod kerja pekerja", MARGIN, y + 4.5);

  y += 10;

  // Info Box (2 columns)
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 32, 2, 2, "FD");

  // Col 1: Worker Info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Dibayar Kepada:", MARGIN + 5, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(receipt.employeeName, MARGIN + 5, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Kod Pekerja: ${receipt.employeeCode}`, MARGIN + 5, y + 18);

  // Col 2: Payment Details
  const col2X = MARGIN + CONTENT_WIDTH / 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Kaedah Bayaran:", col2X, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(receipt.paymentMethod || "CASH", col2X, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Rujukan: ${receipt.reference || "-"}`, col2X, y + 18);

  // Notes row inside box if present
  if (receipt.notes) {
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN + 5, y + 22, MARGIN + CONTENT_WIDTH - 5, y + 22);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Catatan: ${receipt.notes}`, MARGIN + 5, y + 28);
  }

  y += 38;

  // Table Section Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text("PERINCIAN REKOD KERJA DISELESAIKAN (FIFO)", MARGIN, y);

  y += 4;

  // Table Header Row
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.rect(MARGIN, y, CONTENT_WIDTH, 8, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("No.", MARGIN + 4, y + 5.5);
  doc.text("Tarikh Kerja", MARGIN + 18, y + 5.5);
  doc.text("Kadar Harian (RM)", MARGIN + 85, y + 5.5, { align: "right" });
  doc.text("Jumlah Dibayar (RM)", MARGIN + 135, y + 5.5, { align: "right" });
  doc.text("Status", MARGIN + CONTENT_WIDTH - 6, y + 5.5, { align: "right" });

  y += 8;

  // Table Rows
  const items = receipt.items || [];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  items.forEach((item, index) => {
    // Check if new page is needed
    if (y > PAGE_HEIGHT - 45) {
      doc.addPage();
      y = MARGIN;
    }

    // Row alternating background
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "F");

    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, y + 7, MARGIN + CONTENT_WIDTH, y + 7);

    doc.setTextColor(71, 85, 105);
    doc.text(String(index + 1), MARGIN + 4, y + 5);
    doc.text(item.workDate, MARGIN + 18, y + 5);

    doc.text(Number(item.dailyRate).toFixed(2), MARGIN + 85, y + 5, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(Number(item.amountApplied).toFixed(2), MARGIN + 135, y + 5, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(5, 150, 105);
    doc.text(item.workRecordStatus || "PAID", MARGIN + CONTENT_WIDTH - 6, y + 5, { align: "right" });

    y += 7;
  });

  if (items.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 9, "F");
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "italic");
    doc.text("Bayaran diagihkan ke atas baki tertunggak pekerja.", MARGIN + 5, y + 6);
    y += 9;
  }

  y += 6;

  // Total Summary Banner
  doc.setFillColor(236, 253, 245); // Emerald-50
  doc.setDrawColor(167, 243, 208); // Emerald-200
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 16, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(4, 120, 87); // Emerald-700
  doc.text("JUMLAH KESELURUHAN DIBAYAR", MARGIN + 6, y + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text("Status Bayaran: Selesai (PAID)", MARGIN + 6, y + 11.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(4, 120, 87);
  doc.text(`RM ${Number(receipt.totalAmount).toFixed(2)}`, MARGIN + CONTENT_WIDTH - 6, y + 10.5, { align: "right" });

  y += 24;

  // Signature / Approval Block
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);

  // Left: Authorized By
  doc.line(MARGIN, y + 14, MARGIN + 55, y + 14);
  doc.text("Tandatangan Majikan / Pengurus", MARGIN, y + 18);
  doc.text("Sepakat Silaturrahim Enterprise", MARGIN, y + 22);

  // Right: Received By
  const sigRightX = MARGIN + CONTENT_WIDTH - 55;
  doc.line(sigRightX, y + 14, MARGIN + CONTENT_WIDTH, y + 14);
  doc.text("Tandatangan Penerima", sigRightX, y + 18);
  doc.text(receipt.employeeName, sigRightX, y + 22);

  // Footer Disclaimer
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, PAGE_HEIGHT - 12, MARGIN + CONTENT_WIDTH, PAGE_HEIGHT - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Resit janaan komputer - Sepakat Silaturrahim Enterprise. Tandatangan digital sah.", MARGIN, PAGE_HEIGHT - 8);
  doc.text(`ID Resit: ${receipt.paymentCode}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, { align: "right" });

  // Save the PDF
  doc.save(`Resit-Bayaran-${receipt.paymentCode}.pdf`);
}

/**
 * Downloads the Monthly Financial Statement as a PDF.
 */
export function downloadMonthlyReportPdf(
  report: MonthlyReport,
  year: number,
  monthName: string
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = MARGIN;

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(MARGIN, y, CONTENT_WIDTH, 20, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("SEPAKAT SILATURRAHIM ENTERPRISE", MARGIN + 6, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Penyata Kewangan & Gaji Bulanan - ${monthName} ${year}`, MARGIN + 6, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Tarikh Cetakan: ${formatDate(new Date())}`, PAGE_WIDTH - MARGIN - 6, y + 14, { align: "right" });

  y += 26;

  // 4 KPI Summary Cards (2x2 grid)
  const cardW = (CONTENT_WIDTH - 6) / 4;
  const cardH = 18;

  // Card 1: Total Records
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(MARGIN, y, cardW, cardH, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("JUMLAH REKOD", MARGIN + 4, y + 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(String(report.totalWorkRecords), MARGIN + 4, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Syif kehadiran", MARGIN + 4, y + 16);

  // Card 2: Gross Payroll
  const c2X = MARGIN + cardW + 2;
  doc.roundedRect(c2X, y, cardW, cardH, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("GAJI KASAR", c2X + 4, y + 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`RM ${report.grossPayroll.toFixed(2)}`, c2X + 4, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Jumlah perolehan", c2X + 4, y + 16);

  // Card 3: Paid Amount
  const c3X = c2X + cardW + 2;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(c3X, y, cardW, cardH, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(4, 120, 87);
  doc.text("TELAH DIBAYAR", c3X + 4, y + 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(4, 120, 87);
  doc.text(`RM ${report.paidAmount.toFixed(2)}`, c3X + 4, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(5, 150, 105);
  doc.text("Baucar bayaran selesai", c3X + 4, y + 16);

  // Card 4: Outstanding
  const c4X = c3X + cardW + 2;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(c4X, y, cardW, cardH, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(180, 83, 9);
  doc.text("BAKI TERTUNGGAK", c4X + 4, y + 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(180, 83, 9);
  doc.text(`RM ${report.outstandingAmount.toFixed(2)}`, c4X + 4, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(217, 119, 6);
  doc.text("Liabiliti semasa", c4X + 4, y + 16);

  y += 24;

  // Table Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`SENARAI REKOD KERJA & GAJI (${report.records?.length || 0} REKOD)`, MARGIN, y);

  y += 4;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text("Tarikh", MARGIN + 4, y + 5);
  doc.text("Kod", MARGIN + 26, y + 5);
  doc.text("Nama Pekerja", MARGIN + 46, y + 5);
  doc.text("Kadar (RM)", MARGIN + 115, y + 5, { align: "right" });
  doc.text("Amaun (RM)", MARGIN + 145, y + 5, { align: "right" });
  doc.text("Status", MARGIN + CONTENT_WIDTH - 4, y + 5, { align: "right" });

  y += 7;

  // Table Rows
  const records = report.records || [];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  records.forEach((r, idx) => {
    if (y > PAGE_HEIGHT - 25) {
      doc.addPage();
      y = MARGIN;

      // Repeat Table Header on next page
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text("Tarikh", MARGIN + 4, y + 5);
      doc.text("Kod", MARGIN + 26, y + 5);
      doc.text("Nama Pekerja", MARGIN + 46, y + 5);
      doc.text("Kadar (RM)", MARGIN + 115, y + 5, { align: "right" });
      doc.text("Amaun (RM)", MARGIN + 145, y + 5, { align: "right" });
      doc.text("Status", MARGIN + CONTENT_WIDTH - 4, y + 5, { align: "right" });

      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(MARGIN, y, CONTENT_WIDTH, 6, "F");
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(MARGIN, y + 6, MARGIN + CONTENT_WIDTH, y + 6);

    doc.setTextColor(71, 85, 105);
    doc.text(r.workDate, MARGIN + 4, y + 4.5);
    doc.text(r.employeeCode, MARGIN + 26, y + 4.5);

    doc.setTextColor(15, 23, 42);
    doc.text(r.employeeName.length > 28 ? r.employeeName.substring(0, 28) + "..." : r.employeeName, MARGIN + 46, y + 4.5);

    doc.setTextColor(71, 85, 105);
    doc.text(Number(r.dailyRate).toFixed(2), MARGIN + 115, y + 4.5, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(Number(r.amount).toFixed(2), MARGIN + 145, y + 4.5, { align: "right" });

    doc.setFont("helvetica", "normal");
    const statusColor = r.status === "PAID" ? [5, 150, 105] : r.status === "STORED" ? [217, 119, 6] : [71, 85, 105];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(r.status || "UNPAID", MARGIN + CONTENT_WIDTH - 4, y + 4.5, { align: "right" });

    y += 6;
  });

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, PAGE_HEIGHT - 12, MARGIN + CONTENT_WIDTH, PAGE_HEIGHT - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Laporan janaan automatik - Sepakat Silaturrahim Enterprise.", MARGIN, PAGE_HEIGHT - 8);
  doc.text(`Penyata Kewangan ${monthName} ${year}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, { align: "right" });

  doc.save(`Penyata-Bulanan-${year}-${monthName}.pdf`);
}

/**
 * Downloads the Outstanding Balances Report as a PDF.
 */
export function downloadOutstandingReportPdf(
  reports: OutstandingEmployeeReport[]
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = MARGIN;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(MARGIN, y, CONTENT_WIDTH, 20, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("SEPAKAT SILATURRAHIM ENTERPRISE", MARGIN + 6, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text("Laporan Baki Gaji Belum Selesai (Outstanding Liability Register)", MARGIN + 6, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Tarikh: ${formatDate(new Date())}`, PAGE_WIDTH - MARGIN - 6, y + 14, { align: "right" });

  y += 26;

  // Calculate totals
  const totalOutstanding = reports.reduce(
    (acc, curr) => acc + (curr.totalOutstanding || curr.outstandingBalance || 0),
    0
  );
  const totalStored = reports.reduce(
    (acc, curr) => acc + (curr.storedAmount || 0),
    0
  );
  const totalUnpaidDays = reports.reduce(
    (acc, curr) => acc + (curr.unpaidDays || curr.totalWorkDaysUnpaid || 0),
    0
  );
  const totalStoredDays = reports.reduce(
    (acc, curr) => acc + (curr.storedDays || curr.storedCount || 0),
    0
  );

  // Summary Banner
  doc.setFillColor(254, 242, 242); // Rose-50
  doc.setDrawColor(254, 202, 202); // Rose-200
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 18, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(185, 28, 28); // Rose-700
  doc.text("JUMLAH KESELURUHAN LIABILITI GAJI", MARGIN + 5, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(159, 18, 57);
  doc.text(`RM ${totalOutstanding.toFixed(2)}`, MARGIN + 5, y + 13);

  // Right details in summary banner
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Pekerja Terlibat: ${reports.length} orang`, MARGIN + CONTENT_WIDTH - 5, y + 6, { align: "right" });
  doc.text(`Hari Belum Bayar: ${totalUnpaidDays} hari | Tabung: ${totalStoredDays} hari (RM ${totalStored.toFixed(2)})`, MARGIN + CONTENT_WIDTH - 5, y + 12, { align: "right" });

  y += 24;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text("Kod", MARGIN + 4, y + 5);
  doc.text("Nama Pekerja", MARGIN + 25, y + 5);
  doc.text("No. Tel", MARGIN + 85, y + 5);
  doc.text("Belum Bayar", MARGIN + 120, y + 5, { align: "right" });
  doc.text("Tabung (RM)", MARGIN + 150, y + 5, { align: "right" });
  doc.text("Jumlah Baki (RM)", MARGIN + CONTENT_WIDTH - 4, y + 5, { align: "right" });

  y += 7;

  // Table Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  reports.forEach((row, idx) => {
    if (y > PAGE_HEIGHT - 25) {
      doc.addPage();
      y = MARGIN;

      // Table Header repeated
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text("Kod", MARGIN + 4, y + 5);
      doc.text("Nama Pekerja", MARGIN + 25, y + 5);
      doc.text("No. Tel", MARGIN + 85, y + 5);
      doc.text("Belum Bayar", MARGIN + 120, y + 5, { align: "right" });
      doc.text("Tabung (RM)", MARGIN + 150, y + 5, { align: "right" });
      doc.text("Jumlah Baki (RM)", MARGIN + CONTENT_WIDTH - 4, y + 5, { align: "right" });

      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(MARGIN, y, CONTENT_WIDTH, 6, "F");
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(MARGIN, y + 6, MARGIN + CONTENT_WIDTH, y + 6);

    const unpaid = row.unpaidDays || row.totalWorkDaysUnpaid || 0;
    const stored = row.storedAmount || 0;
    const total = row.totalOutstanding || row.outstandingBalance || 0;

    doc.setTextColor(71, 85, 105);
    doc.text(row.employeeCode, MARGIN + 4, y + 4.5);

    doc.setTextColor(15, 23, 42);
    doc.text(row.employeeName.length > 25 ? row.employeeName.substring(0, 25) + "..." : row.employeeName, MARGIN + 25, y + 4.5);

    doc.setTextColor(100, 116, 139);
    doc.text(row.phone || "-", MARGIN + 85, y + 4.5);

    doc.setTextColor(71, 85, 105);
    doc.text(`${unpaid} hari`, MARGIN + 120, y + 4.5, { align: "right" });

    doc.text(stored.toFixed(2), MARGIN + 150, y + 4.5, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(225, 29, 72); // Rose-600
    doc.text(total.toFixed(2), MARGIN + CONTENT_WIDTH - 4, y + 4.5, { align: "right" });

    doc.setFont("helvetica", "normal");
    y += 6;
  });

  // Table Footer
  doc.setDrawColor(203, 213, 225);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  doc.setFillColor(241, 245, 249);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("JUMLAH KESELURUHAN:", MARGIN + 25, y + 5);
  doc.text(`${totalUnpaidDays} hari`, MARGIN + 120, y + 5, { align: "right" });
  doc.text(totalStored.toFixed(2), MARGIN + 150, y + 5, { align: "right" });
  doc.setTextColor(225, 29, 72);
  doc.text(`RM ${totalOutstanding.toFixed(2)}`, MARGIN + CONTENT_WIDTH - 4, y + 5, { align: "right" });

  y += 12;

  // Footer Disclaimer
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, PAGE_HEIGHT - 12, MARGIN + CONTENT_WIDTH, PAGE_HEIGHT - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Laporan janaan automatik - Sepakat Silaturrahim Enterprise.", MARGIN, PAGE_HEIGHT - 8);
  doc.text("Laporan Liabiliti Baki Tertunggak", PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, { align: "right" });

  doc.save(`Laporan-Baki-Tertunggak-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Downloads the Daily Attendance and Payroll Register as a PDF.
 */
export function downloadDailyReportPdf(
  report: DailyReport,
  dateString: string
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = MARGIN;

  // Header Banner
  doc.setFillColor(5, 150, 105); // Emerald-600
  doc.rect(MARGIN, y, CONTENT_WIDTH, 20, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("SEPAKAT SILATURRAHIM ENTERPRISE", MARGIN + 6, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(209, 250, 229);
  doc.text(`Penyata Kehadiran & Gaji Harian - ${formatDate(dateString)}`, MARGIN + 6, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text(`Tarikh Cetakan: ${formatDate(new Date())}`, PAGE_WIDTH - MARGIN - 6, y + 14, { align: "right" });

  y += 26;

  // Daily Summary KPI Cards (2 cards)
  const cardW = (CONTENT_WIDTH - 4) / 2;
  const cardH = 16;

  // Card 1: Total Attendance
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(MARGIN, y, cardW, cardH, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("JUMLAH PEKERJA HADIR", MARGIN + 5, y + 5.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${report.totalRecords} orang`, MARGIN + 5, y + 12);

  // Card 2: Total Daily Payroll
  const c2X = MARGIN + cardW + 4;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(c2X, y, cardW, cardH, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(4, 120, 87);
  doc.text("JUMLAH GAJI HARIAN", c2X + 5, y + 5.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(4, 120, 87);
  doc.text(`RM ${Number(report.totalAmount).toFixed(2)}`, c2X + 5, y + 12);

  y += 22;

  // Table Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`DAFTAR KEHADIRAN HARIAN (${formatDate(dateString)})`, MARGIN, y);

  y += 4;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text("No.", MARGIN + 4, y + 5);
  doc.text("Kod", MARGIN + 14, y + 5);
  doc.text("Nama Pekerja", MARGIN + 35, y + 5);
  doc.text("Kadar (RM)", MARGIN + 105, y + 5, { align: "right" });
  doc.text("Amaun (RM)", MARGIN + 135, y + 5, { align: "right" });
  doc.text("Status", MARGIN + 160, y + 5);
  doc.text("Catatan", MARGIN + CONTENT_WIDTH - 4, y + 5, { align: "right" });

  y += 7;

  // Table Rows
  const records = report.records || [];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  records.forEach((r, idx) => {
    if (y > PAGE_HEIGHT - 25) {
      doc.addPage();
      y = MARGIN;

      // Table Header repeated
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text("No.", MARGIN + 4, y + 5);
      doc.text("Kod", MARGIN + 14, y + 5);
      doc.text("Nama Pekerja", MARGIN + 35, y + 5);
      doc.text("Kadar (RM)", MARGIN + 105, y + 5, { align: "right" });
      doc.text("Amaun (RM)", MARGIN + 135, y + 5, { align: "right" });
      doc.text("Status", MARGIN + 160, y + 5);
      doc.text("Catatan", MARGIN + CONTENT_WIDTH - 4, y + 5, { align: "right" });

      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(MARGIN, y, CONTENT_WIDTH, 6, "F");
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(MARGIN, y + 6, MARGIN + CONTENT_WIDTH, y + 6);

    doc.setTextColor(71, 85, 105);
    doc.text(String(idx + 1), MARGIN + 4, y + 4.5);
    doc.text(r.employeeCode, MARGIN + 14, y + 4.5);

    doc.setTextColor(15, 23, 42);
    doc.text(r.employeeName.length > 25 ? r.employeeName.substring(0, 25) + "..." : r.employeeName, MARGIN + 35, y + 4.5);

    doc.setTextColor(71, 85, 105);
    doc.text(Number(r.dailyRate).toFixed(2), MARGIN + 105, y + 4.5, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(Number(r.amount).toFixed(2), MARGIN + 135, y + 4.5, { align: "right" });

    doc.setFont("helvetica", "normal");
    const statusColor = r.status === "PAID" ? [5, 150, 105] : r.status === "STORED" ? [217, 119, 6] : [71, 85, 105];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(r.status || "UNPAID", MARGIN + 160, y + 4.5);

    doc.setTextColor(148, 163, 184);
    doc.text(r.notes ? (r.notes.length > 15 ? r.notes.substring(0, 15) + "..." : r.notes) : "-", MARGIN + CONTENT_WIDTH - 4, y + 4.5, { align: "right" });

    y += 6;
  });

  // Table Footer Total
  doc.setDrawColor(203, 213, 225);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  doc.setFillColor(241, 245, 249);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("JUMLAH HARIAN:", MARGIN + 35, y + 5);
  doc.text(`RM ${Number(report.totalAmount).toFixed(2)}`, MARGIN + 135, y + 5, { align: "right" });
  doc.text(`${records.length} pekerja`, MARGIN + 160, y + 5);

  // Footer Disclaimer
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, PAGE_HEIGHT - 12, MARGIN + CONTENT_WIDTH, PAGE_HEIGHT - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Laporan janaan automatik - Sepakat Silaturrahim Enterprise.", MARGIN, PAGE_HEIGHT - 8);
  doc.text(`Daftar Harian ${formatDate(dateString)}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, { align: "right" });

  doc.save(`Laporan-Harian-${dateString}.pdf`);
}
