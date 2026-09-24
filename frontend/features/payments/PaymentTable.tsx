"use client";

import React from "react";
import {
  CreditCard,
  Money,
  Bank,
  QrCode,
  Receipt,
  Coins,
} from "@phosphor-icons/react";
import { Payment } from "@/types/payment";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface PaymentTableProps {
  payments: Payment[];
  isLoading?: boolean;
  onViewReceipt: (payment: Payment) => void;
  onMakePayment?: () => void;
  hasFilter?: boolean;
}

export function PaymentTable({
  payments,
  isLoading = false,
  onViewReceipt,
  onMakePayment,
  hasFilter = false,
}: PaymentTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Code</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Date</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {[1, 2, 3, 4, 5].map((idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-28 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center mb-4">
          <Coins size={28} weight="duotone" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {hasFilter ? "No matching payment records found" : "No payments processed yet"}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          {hasFilter
            ? "Try adjusting your worker or date filters to find previous disbursements."
            : "Record your first employee payment disbursement to settle outstanding work records."}
        </p>
        {onMakePayment && (
          <div className="mt-6">
            <Button
              variant="primary"
              size="sm"
              onClick={onMakePayment}
              leftIcon={<CreditCard size={16} weight="bold" />}
              className="whitespace-nowrap"
            >
              Make Payment
            </Button>
          </div>
        )}
      </div>
    );
  }

  const renderMethodBadge = (method?: string) => {
    switch (method) {
      case "CASH":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Money size={13} weight="bold" />
            Cash
          </span>
        );
      case "BANK_TRANSFER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <Bank size={13} weight="bold" />
            Bank Transfer
          </span>
        );
      case "DUITNOW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <QrCode size={13} weight="bold" />
            DuitNow
          </span>
        );
      case "OTHER":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <CreditCard size={13} weight="bold" />
            {method || "Other"}
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Code</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Date</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="hover:bg-slate-50/75 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="py-3.5 px-4 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  {payment.paymentCode}
                </td>
                <td className="py-3.5 px-4">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {payment.employeeName}
                  </div>
                  {payment.employeeCode && (
                    <div className="text-xs font-mono text-slate-400 dark:text-slate-500">
                      {payment.employeeCode}
                    </div>
                  )}
                </td>
                <td className="py-3.5 px-4 text-sm font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {formatDate(payment.paymentDate)}
                </td>
                <td className="py-3.5 px-4 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap tabular-nums">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {renderMethodBadge(payment.paymentMethod)}
                </td>
                <td className="py-3.5 px-4 text-xs font-mono text-slate-500 dark:text-slate-400 max-w-xs truncate">
                  {payment.reference ? payment.reference : "-"}
                </td>
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewReceipt(payment)}
                    leftIcon={<Receipt size={14} weight="bold" />}
                    className="whitespace-nowrap text-slate-700 hover:text-emerald-700 hover:border-emerald-300 dark:text-slate-300 dark:hover:text-emerald-400"
                  >
                    Receipt
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PaymentTable;
