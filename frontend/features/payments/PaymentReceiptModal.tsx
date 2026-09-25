"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Printer,
  Receipt,
  CheckCircle,
  CalendarBlank,
  CreditCard,
  User,
  WarningCircle,
  CircleNotch,
  DownloadSimple,
} from "@phosphor-icons/react";
import { ReceiptDto } from "@/types/payment";
import { paymentService } from "@/services/paymentService";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { COMPANY_NAME, SYSTEM_NAME } from "@/lib/constants";
import { downloadReceiptPdf } from "@/lib/pdfGenerator";

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt?: ReceiptDto | null;
  paymentId?: number | null;
}

export function PaymentReceiptModal({
  isOpen,
  onClose,
  receipt: initialReceipt,
  paymentId,
}: PaymentReceiptModalProps) {
  const [receipt, setReceipt] = useState<ReceiptDto | null>(initialReceipt || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipt = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await paymentService.getReceipt(id);
      setReceipt(data);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load payment receipt.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialReceipt) {
        setReceipt(initialReceipt);
        setError(null);
      } else if (paymentId) {
        fetchReceipt(paymentId);
      }
    } else {
      setReceipt(null);
      setError(null);
    }
  }, [isOpen, initialReceipt, paymentId, fetchReceipt]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownloadReceipt = () => {
    if (!receipt) return;
    downloadReceiptPdf(receipt);
  };

  if (!isOpen) {
    return null;
  }

  const formatMethodLabel = (method?: string) => {
    switch (method) {
      case "CASH":
        return "Cash";
      case "BANK_TRANSFER":
        return "Bank Transfer";
      case "DUITNOW":
        return "DuitNow";
      case "OTHER":
        return "Other";
      default:
        return method || "Cash";
    }
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #payment-receipt-printable,
          #payment-receipt-printable * {
            visibility: visible !important;
          }
          #payment-receipt-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 16mm !important;
            background: #ffffff !important;
            color: #0f172a !important;
            border: none !important;
            box-shadow: none !important;
          }
          .receipt-no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-receipt-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      >
        <div
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-2 sm:my-8 overflow-hidden flex flex-col max-h-[92dvh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Controls (Hidden on Print) */}
          <div className="receipt-no-print flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Receipt size={22} weight="duotone" />
              </div>
              <div>
                <h2
                  id="payment-receipt-title"
                  className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100"
                >
                  Payment Receipt
                </h2>
                <p className="text-2xs sm:text-xs text-slate-500 dark:text-slate-400">
                  Official settlement receipt for disbursed wages
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadReceipt}
                disabled={isLoading || !receipt}
                leftIcon={<DownloadSimple size={16} weight="bold" />}
                className="hidden sm:inline-flex whitespace-nowrap"
              >
                Download PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={isLoading || !receipt}
                leftIcon={<Printer size={16} weight="bold" />}
                className="hidden sm:inline-flex whitespace-nowrap"
              >
                Print Receipt
              </Button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X size={20} weight="bold" />
              </button>
            </div>
          </div>

          {/* Modal Content Scroll Area */}
          <div className="overflow-y-auto p-4 sm:p-6 flex-1 min-w-0">
            {isLoading && (
              <div className="py-16 flex flex-col items-center justify-center text-slate-500">
                <CircleNotch size={32} className="animate-spin text-emerald-600 mb-3" />
                <p className="text-sm font-medium">Loading receipt details...</p>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-300 text-sm flex items-start gap-3"
              >
                <WarningCircle size={20} weight="fill" className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-sm">Receipt Error</div>
                  <div className="text-xs mt-0.5">{error}</div>
                </div>
              </div>
            )}

            {!isLoading && receipt && (
              <div
                id="payment-receipt-printable"
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl space-y-6"
              >
                {/* Official Header */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Official Company Seal Graphic */}
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex flex-col items-center justify-center shadow-md shrink-0 border border-emerald-500/30">
                        <span className="text-base font-extrabold tracking-tighter leading-none">SSE</span>
                        <span className="text-[8px] font-semibold tracking-widest text-emerald-200 uppercase mt-0.5">RESIT</span>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-400">
                          Official Receipt
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">
                          {receipt.companyName || COMPANY_NAME}
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {SYSTEM_NAME}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle size={14} weight="fill" />
                        {receipt.paymentCode}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        Date: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(receipt.paymentDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Paid To:</span>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <User size={15} className="text-slate-400" />
                      <span>{receipt.employeeName}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 ml-5 block">
                      Code: {receipt.employeeCode}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Payment Method:</span>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <CreditCard size={15} className="text-slate-400" />
                      <span>{formatMethodLabel(receipt.paymentMethod)}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Reference: <span className="font-mono text-slate-700 dark:text-slate-300">{receipt.reference ? receipt.reference : "-"}</span>
                    </div>
                  </div>

                  {receipt.notes && (
                    <div className="sm:col-span-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
                      <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Notes:</span>
                      <p className="text-slate-700 dark:text-slate-300 italic">{receipt.notes}</p>
                    </div>
                  )}
                </div>

                {/* Itemized Table of Work Records Settled */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Settled Work Records (FIFO Allocation)
                    </h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {receipt.items?.length || 0} work {receipt.items?.length === 1 ? "record" : "records"} settled
                    </span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                          <th className="py-2.5 px-3 font-semibold">Work Date</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Daily Rate</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Amount Applied</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Settlement Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {receipt.items && receipt.items.length > 0 ? (
                          receipt.items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                {formatDate(item.workDate)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {formatCurrency(item.dailyRate)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                {formatCurrency(item.amountApplied)}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <span className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-semibold",
                                  item.workRecordStatus === "PAID"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                                    : "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800"
                                )}>
                                  {item.workRecordStatus || "PAID"}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-400 dark:text-slate-500 italic">
                              Payment applied toward outstanding worker balance.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total Summary Block */}
                <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 dark:text-emerald-300">
                      Total Disbursed Amount
                    </span>
                    <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
                      Status: Settlement Completed (PAID)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 tabular-nums">
                      {formatCurrency(receipt.totalAmount)}
                    </div>
                  </div>
                </div>

                {/* Receipt Legal & Audit Footer */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-2xs text-slate-400 dark:text-slate-500">
                  <span>
                    Computer-generated receipt - Sepakat Silaturrahim Enterprise.
                  </span>
                  <span className="font-mono">
                    Receipt ID: {receipt.paymentCode}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions (Hidden on Print) */}
          <div className="receipt-no-print px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleDownloadReceipt}
              disabled={isLoading || !receipt}
              leftIcon={<DownloadSimple size={16} weight="bold" />}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Download PDF Receipt
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handlePrint}
              disabled={isLoading || !receipt}
              leftIcon={<Printer size={16} weight="bold" />}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Print Receipt
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default PaymentReceiptModal;
