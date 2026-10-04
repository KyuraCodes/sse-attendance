"use client";

import React, { useState, useMemo } from "react";
import {
  TrendUp,
  Users,
  Money,
  CalendarBlank,
  ChartBar,
} from "@phosphor-icons/react";
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { WeeklyTrendPoint } from "@/types/dashboard";
import { formatCurrency, cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface WeeklyTrendChartProps {
  data?: WeeklyTrendPoint[];
  isLoading?: boolean;
}

type MetricMode = "payroll" | "attendance" | "combined";

const chartConfig = {
  payroll: {
    label: "Kos Gaji",
    color: "#10b981",
  },
  workers: {
    label: "Kehadiran",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

export function WeeklyTrendChart({
  data = [],
  isLoading = false,
}: WeeklyTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricMode>("payroll");

  const points = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const totalWeekPayroll = useMemo(() => {
    return points.reduce((acc, p) => acc + (p.totalPayroll || 0), 0);
  }, [points]);

  const avgAttendance = useMemo(() => {
    if (points.length === 0) return 0;
    return Math.round(
      points.reduce((acc, p) => acc + (p.workersCount || 0), 0) / points.length
    );
  }, [points]);

  const chartData = useMemo(() => {
    return points.map((p) => ({
      date: p.date,
      dayLabel: p.dayLabel,
      payroll: p.totalPayroll,
      workers: p.workersCount,
    }));
  }, [points]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="h-56 w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Weekly Performance and Trends"
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/90 p-5 shadow-xs"
    >
      {/* Header and Metric Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendUp size={16} weight="bold" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              7-Day Operational Trends
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {activeMetric === "payroll" &&
              `Total 7-day payroll liability: ${formatCurrency(totalWeekPayroll)}`}
            {activeMetric === "attendance" &&
              `Average daily presence: ${avgAttendance} staff`}
            {activeMetric === "combined" &&
              `Overview: ${formatCurrency(totalWeekPayroll)} total | ${avgAttendance} staff avg`}
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveMetric("payroll")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
              activeMetric === "payroll"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <Money size={14} weight="bold" />
            <span>Payroll</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric("attendance")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
              activeMetric === "attendance"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <Users size={14} weight="bold" />
            <span>Attendance</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric("combined")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
              activeMetric === "combined"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <ChartBar size={14} weight="bold" />
            <span>Combined</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      {points.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs gap-2">
          <CalendarBlank size={28} weight="duotone" />
          <span>No operational trend data available for the past 7 days</span>
        </div>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[220px] w-full"
        >
          <ComposedChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 12, right: 12, left: 12, bottom: 4 }}
          >
            <defs>
              <linearGradient id="fillPayroll" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-payroll)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-payroll)"
                  stopOpacity={0.0}
                />
              </linearGradient>
              <linearGradient id="fillWorkers" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-workers)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-workers)"
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              className="stroke-slate-200 dark:stroke-slate-800"
            />

            <XAxis
              dataKey="dayLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={16}
              className="text-[11px] font-medium fill-slate-500 dark:fill-slate-400"
            />

            <YAxis yAxisId="payroll" hide domain={[0, "auto"]} />
            <YAxis
              yAxisId="workers"
              orientation="right"
              hide
              domain={[0, "auto"]}
            />

            {/* shadcn ui Chart Tooltip per https://ui.shadcn.com/charts/tooltip#charts */}
            <ChartTooltip
              cursor={{
                stroke: "rgba(148, 163, 184, 0.35)",
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="w-56 p-3 shadow-xl border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs"
                  labelFormatter={(_label, payload) => {
                    const item = payload?.[0]?.payload as
                      | { date: string; dayLabel: string }
                      | undefined;
                    if (!item) return null;
                    return (
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-1 border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
                        <CalendarBlank size={13} className="text-slate-400" />
                        <span>
                          {item.dayLabel}, {item.date}
                        </span>
                      </div>
                    );
                  }}
                  formatter={(value, name, item) => {
                    const isPayroll = name === "payroll";
                    const isWorkers = name === "workers";
                    const itemRow = item?.payload as
                      | { payroll?: number; workers?: number }
                      | undefined;

                    return (
                      <div className="flex flex-col w-full gap-1">
                        <div className="flex w-full items-center justify-between gap-3 text-xs py-0.5">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                              style={{
                                backgroundColor: isPayroll
                                  ? "var(--color-payroll)"
                                  : "var(--color-workers)",
                              }}
                            />
                            <span className="text-slate-600 dark:text-slate-400 font-medium">
                              {isPayroll ? "Kos Gaji" : "Kehadiran"}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs tabular-nums">
                            {isPayroll
                              ? formatCurrency(Number(value))
                              : `${value} staf`}
                          </span>
                        </div>

                        {/* Show secondary metric if currently in single metric view */}
                        {activeMetric === "payroll" &&
                          isPayroll &&
                          itemRow?.workers !== undefined && (
                            <div className="flex w-full items-center justify-between gap-3 text-[11px] py-0.5 opacity-80">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="h-2 w-2 shrink-0 rounded-[2px]"
                                  style={{
                                    backgroundColor: "var(--color-workers)",
                                  }}
                                />
                                <span className="text-slate-500 dark:text-slate-400">
                                  Kehadiran
                                </span>
                              </div>
                              <span className="font-mono font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                                {itemRow.workers} staf
                              </span>
                            </div>
                          )}

                        {activeMetric === "attendance" &&
                          isWorkers &&
                          itemRow?.payroll !== undefined && (
                            <div className="flex w-full items-center justify-between gap-3 text-[11px] py-0.5 opacity-80">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="h-2 w-2 shrink-0 rounded-[2px]"
                                  style={{
                                    backgroundColor: "var(--color-payroll)",
                                  }}
                                />
                                <span className="text-slate-500 dark:text-slate-400">
                                  Kos Gaji
                                </span>
                              </div>
                              <span className="font-mono font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                                {formatCurrency(itemRow.payroll)}
                              </span>
                            </div>
                          )}
                      </div>
                    );
                  }}
                />
              }
            />

            {/* Payroll Area Curve */}
            {(activeMetric === "payroll" || activeMetric === "combined") && (
              <Area
                yAxisId="payroll"
                type="monotone"
                dataKey="payroll"
                name="payroll"
                fill="url(#fillPayroll)"
                stroke="var(--color-payroll)"
                strokeWidth={2.5}
                dot={{
                  fill: "var(--color-payroll)",
                  strokeWidth: 2,
                  r: 3,
                }}
                activeDot={{
                  r: 5.5,
                  strokeWidth: 2,
                  stroke: "#ffffff",
                }}
              />
            )}

            {/* Attendance Series */}
            {activeMetric === "attendance" && (
              <Area
                yAxisId="workers"
                type="monotone"
                dataKey="workers"
                name="workers"
                fill="url(#fillWorkers)"
                stroke="var(--color-workers)"
                strokeWidth={2.5}
                dot={{
                  fill: "var(--color-workers)",
                  strokeWidth: 2,
                  r: 3,
                }}
                activeDot={{
                  r: 5.5,
                  strokeWidth: 2,
                  stroke: "#ffffff",
                }}
              />
            )}

            {activeMetric === "combined" && (
              <Bar
                yAxisId="workers"
                dataKey="workers"
                name="workers"
                fill="var(--color-workers)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                opacity={0.85}
              />
            )}
          </ComposedChart>
        </ChartContainer>
      )}
    </div>
  );
}

export default WeeklyTrendChart;
