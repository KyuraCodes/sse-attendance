"use client";

import React, { useState } from "react";
import {
  TrendUp,
  Users,
  Money,
  CalendarBlank,
} from "@phosphor-icons/react";
import { WeeklyTrendPoint } from "@/types/dashboard";
import { formatCurrency, cn } from "@/lib/utils";

interface WeeklyTrendChartProps {
  data?: WeeklyTrendPoint[];
  isLoading?: boolean;
}

export function WeeklyTrendChart({
  data = [],
  isLoading = false,
}: WeeklyTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<"payroll" | "attendance">("payroll");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="h-48 w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
      </div>
    );
  }

  // Fallback if data is empty
  const points = data.length > 0 ? data : [];
  const maxPayroll = Math.max(...points.map((p) => p.totalPayroll), 100);
  const maxAttendance = Math.max(...points.map((p) => p.workersCount), 5);

  const totalWeekPayroll = points.reduce((acc, p) => acc + p.totalPayroll, 0);
  const avgAttendance = points.length > 0
    ? Math.round(points.reduce((acc, p) => acc + p.workersCount, 0) / points.length)
    : 0;

  // SVG Chart dimensions
  const svgWidth = 640;
  const svgHeight = 180;
  const paddingX = 40;
  const paddingTop = 25;
  const paddingBottom = 30;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (points.length <= 1) return paddingX + plotWidth / 2;
    return paddingX + (index / (points.length - 1)) * plotWidth;
  };

  const getYPayroll = (val: number) => {
    const ratio = val / maxPayroll;
    return paddingTop + plotHeight - ratio * plotHeight;
  };

  const getYAttendance = (val: number) => {
    const ratio = val / maxAttendance;
    return paddingTop + plotHeight - ratio * plotHeight;
  };

  // Generate SVG path for line chart
  const linePoints = points.map((p, idx) => {
    const x = getX(idx);
    const y = activeMetric === "payroll" ? getYPayroll(p.totalPayroll) : getYAttendance(p.workersCount);
    return `${x},${y}`;
  });

  const pathD = linePoints.length > 0 ? `M ${linePoints.join(" L ")}` : "";
  const areaD = linePoints.length > 0
    ? `M ${getX(0)},${paddingTop + plotHeight} L ${linePoints.join(" L ")} L ${getX(points.length - 1)},${paddingTop + plotHeight} Z`
    : "";

  return (
    <div
      role="region"
      aria-label="Weekly Performance and Trends"
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/90 p-5 shadow-xs"
    >
      {/* Header and Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendUp size={16} weight="bold" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              7-Day Operational Trends
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeMetric === "payroll"
              ? `Total 7-day liability: ${formatCurrency(totalWeekPayroll)}`
              : `Average daily presence: ${avgAttendance} staff`}
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto">
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
            <span>Payroll (RM)</span>
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
        </div>
      </div>

      {/* SVG Canvas Area */}
      {points.length === 0 ? (
        <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5">
          <CalendarBlank size={24} weight="duotone" />
          <span>No attendance data available for the past 7 days</span>
        </div>
      ) : (
        <div className="relative w-full">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
            role="img"
            aria-label="7-Day performance chart"
          >
            <defs>
              {/* Linear Gradient for Payroll */}
              <linearGradient id="payrollGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              {/* Linear Gradient for Attendance */}
              <linearGradient id="attendanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle horizontal grid lines */}
            {[0, 0.5, 1].map((ratio) => {
              const y = paddingTop + plotHeight * (1 - ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray="3 3"
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500"
                  >
                    {activeMetric === "payroll"
                      ? `${Math.round(maxPayroll * ratio)}`
                      : `${Math.round(maxAttendance * ratio)}`}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            <path
              d={areaD}
              fill={activeMetric === "payroll" ? "url(#payrollGradient)" : "url(#attendanceGradient)"}
              className="transition-all duration-300"
            />

            {/* Trend Line */}
            <path
              d={pathD}
              fill="none"
              stroke={activeMetric === "payroll" ? "#10b981" : "#3b82f6"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />

            {/* Interactive Data Nodes */}
            {points.map((p, idx) => {
              const cx = getX(idx);
              const cy = activeMetric === "payroll" ? getYPayroll(p.totalPayroll) : getYAttendance(p.workersCount);
              const isHovered = hoveredIndex === idx;

              return (
                <g
                  key={p.date}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${p.dayLabel} (${p.date}): ${
                    activeMetric === "payroll"
                      ? formatCurrency(p.totalPayroll)
                      : `${p.workersCount} workers`
                  }`}
                  onFocus={() => setHoveredIndex(idx)}
                  onBlur={() => setHoveredIndex(null)}
                >
                  {/* Vertical Guideline on Hover */}
                  {isHovered && (
                    <line
                      x1={cx}
                      y1={paddingTop}
                      x2={cx}
                      y2={paddingTop + plotHeight}
                      stroke="currentColor"
                      strokeDasharray="2 2"
                      className="text-slate-400 dark:text-slate-600"
                      strokeWidth="1"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5.5 : 3.5}
                    fill={activeMetric === "payroll" ? "#10b981" : "#3b82f6"}
                    className="stroke-white dark:stroke-slate-900 stroke-2 transition-all duration-150"
                  />

                  {/* Day Label on X Axis */}
                  <text
                    x={cx}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    className={cn(
                      "text-[10px] font-mono transition-colors",
                      isHovered
                        ? "font-bold fill-slate-900 dark:fill-slate-100"
                        : "fill-slate-400 dark:fill-slate-500"
                    )}
                  >
                    {p.dayLabel}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <div
              className="absolute pointer-events-none -top-2 transform -translate-x-1/2 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xs text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700/60 z-20 whitespace-nowrap"
              style={{
                left: `${(getX(hoveredIndex) / svgWidth) * 100}%`,
              }}
            >
              <div className="font-semibold text-[11px] text-slate-300">
                {points[hoveredIndex].dayLabel}, {points[hoveredIndex].date}
              </div>
              <div className="font-mono font-bold text-xs mt-0.5 text-emerald-400">
                {activeMetric === "payroll"
                  ? formatCurrency(points[hoveredIndex].totalPayroll)
                  : `${points[hoveredIndex].workersCount} pekerja hadir`}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WeeklyTrendChart;
