import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, logAudit } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { errorResponse, safeServerError } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (currentUser.role !== "CEO" && currentUser.role !== "OWNER") {
      return errorResponse(
        "Akses ditolak. Sandaran pangkalan data terhad kepada peranan CEO dan OWNER sahaja.",
        "FORBIDDEN",
        403
      );
    }

    const [
      usersRes,
      employeesRes,
      workRecordsRes,
      paymentsRes,
      paymentItemsRes,
      auditLogsRes,
    ] = await Promise.all([
      supabase
        .from("users")
        .select("id, name, email, role, status, avatar_url, created_at")
        .order("id", { ascending: true }),
      supabase
        .from("employees")
        .select("*")
        .order("id", { ascending: true }),
      supabase
        .from("work_records")
        .select("*")
        .order("id", { ascending: true }),
      supabase
        .from("payments")
        .select("*")
        .order("id", { ascending: true }),
      supabase
        .from("payment_items")
        .select("*")
        .order("id", { ascending: true }),
      supabase
        .from("audit_logs")
        .select("*")
        .order("id", { ascending: true }),
    ]);

    if (usersRes.error) throw usersRes.error;
    if (employeesRes.error) throw employeesRes.error;
    if (workRecordsRes.error) throw workRecordsRes.error;
    if (paymentsRes.error) throw paymentsRes.error;
    if (paymentItemsRes.error) throw paymentItemsRes.error;
    if (auditLogsRes.error) throw auditLogsRes.error;

    const usersData = (usersRes.data || []).map((u) => {
      const row = { ...u } as Record<string, unknown>;
      if ("password_hash" in row) {
        row.password_hash = "[REDACTED]";
      }
      return row;
    });

    const employeesData = employeesRes.data || [];
    const workRecordsData = workRecordsRes.data || [];
    const paymentsData = paymentsRes.data || [];
    const paymentItemsData = paymentItemsRes.data || [];
    const auditLogsData = auditLogsRes.data || [];

    const summary = {
      totalUsers: usersData.length,
      totalEmployees: employeesData.length,
      totalWorkRecords: workRecordsData.length,
      totalPayments: paymentsData.length,
      totalPaymentItems: paymentItemsData.length,
      totalAuditLogs: auditLogsData.length,
    };

    const payload = {
      system: "SSEP Payroll System",
      version: "3.0.0",
      exportTimestamp: new Date().toISOString(),
      exportedBy: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      },
      tables: {
        users: usersData,
        employees: employeesData,
        work_records: workRecordsData,
        payments: paymentsData,
        payment_items: paymentItemsData,
        audit_logs: auditLogsData,
      },
      summary,
    };

    await logAudit(
      currentUser.id,
      "DATABASE_BACKUP_DOWNLOADED",
      "system",
      0,
      null,
      JSON.stringify({ timestamp: new Date().toISOString(), summary: payload.summary })
    );

    const dateStr = new Date().toISOString().replace(/[:.]/g, "-");

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="ssep-backup-${dateStr}.json"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Database backup generation error:", err);
    return safeServerError(err, "Ralat semasa menjana sandaran pangkalan data.");
  }
}
