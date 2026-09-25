import { NextRequest } from "next/server";
import { getAuthenticatedUser, logAudit } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/apiResponse";

const VALID_METHODS = ["CASH", "BANK_TRANSFER", "DUITNOW", "OTHER"];

export async function GET(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  let query = supabase
    .from("payments")
    .select(`
      id,
      payment_code,
      employee_id,
      payment_date,
      amount,
      payment_method,
      reference,
      notes,
      created_by,
      created_at,
      employees (
        id,
        employee_code,
        name
      )
    `)
    .order("payment_date", { ascending: false })
    .order("id", { ascending: false });

  if (employeeId) {
    query = query.eq("employee_id", Number(employeeId));
  }
  if (startDate && startDate.trim()) {
    query = query.gte("payment_date", startDate.trim());
  }
  if (endDate && endDate.trim()) {
    query = query.lte("payment_date", endDate.trim());
  }

  const { data: payments, error } = await query;
  if (error) {
    console.error("Fetch payments error:", error);
    return errorResponse("Failed to fetch payments", "FETCH_FAILED", 500);
  }

  const result = (payments || []).map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emp = p.employees as any;
    return {
      id: p.id,
      paymentCode: p.payment_code,
      employeeId: p.employee_id,
      employeeCode: emp?.employee_code || "",
      employeeName: emp?.name || "",
      paymentDate: p.payment_date,
      amount: Number(p.amount),
      paymentMethod: p.payment_method,
      reference: p.reference,
      notes: p.notes,
      createdBy: p.created_by,
      createdAt: p.created_at,
    };
  });

  return successResponse(result, "Payments retrieved");
}

export async function POST(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  try {
    const body = await req.json();
    const { employeeId, amount, paymentDate, paymentMethod, reference, notes } = body;

    if (!employeeId) {
      return errorResponse("Employee ID is required", "INVALID_EMPLOYEE_ID", 400);
    }
    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return errorResponse("Payment amount must be greater than zero", "INVALID_PAYMENT_AMOUNT", 400);
    }

    const normMethod = (paymentMethod || "CASH").trim().toUpperCase();
    if (!VALID_METHODS.includes(normMethod)) {
      return errorResponse("Invalid payment method", "INVALID_PAYMENT_METHOD", 400);
    }

    const { data: employee, error: empErr } = await supabase
      .from("employees")
      .select("id, employee_code, name")
      .eq("id", Number(employeeId))
      .maybeSingle();

    if (empErr || !employee) {
      return errorResponse("Employee not found", "EMPLOYEE_NOT_FOUND", 404);
    }

    // Fetch payable work records for employee
    const { data: payableRecords, error: wrErr } = await supabase
      .from("work_records")
      .select("id, work_date, amount, status")
      .eq("employee_id", employee.id)
      .in("status", ["UNPAID", "STORED", "PARTIALLY_PAID"])
      .order("work_date", { ascending: true })
      .order("id", { ascending: true });

    if (wrErr) {
      return errorResponse("Failed to fetch work records", "FETCH_FAILED", 500);
    }

    // Calculate applied payments for each work record
    const recordIds = (payableRecords || []).map((r) => r.id);
    let appliedMap: Record<number, number> = {};

    if (recordIds.length > 0) {
      const { data: existingItems } = await supabase
        .from("payment_items")
        .select("work_record_id, amount_applied")
        .in("work_record_id", recordIds);

      if (existingItems) {
        for (const item of existingItems) {
          appliedMap[item.work_record_id] =
            (appliedMap[item.work_record_id] || 0) + Number(item.amount_applied);
        }
      }
    }

    let totalOutstanding = 0;
    const recordsWithUnpaid: { id: number; workDate: string; amount: number; unpaid: number; status: string }[] = [];

    for (const r of payableRecords || []) {
      const applied = appliedMap[r.id] || 0;
      const unpaid = Number(r.amount) - applied;
      if (unpaid > 0.001) {
        totalOutstanding += unpaid;
        recordsWithUnpaid.push({
          id: r.id,
          workDate: r.work_date,
          amount: Number(r.amount),
          unpaid,
          status: r.status,
        });
      }
    }

    if (payAmount > totalOutstanding + 0.01) {
      return errorResponse("Payment amount exceeds outstanding balance", "PAYMENT_EXCEEDS_BALANCE", 400);
    }

    // Generate unique payment code
    const { count } = await supabase.from("payments").select("*", { count: "exact", head: true });
    let payIndex = (count || 0) + 1;
    let paymentCode = `PAY-${String(payIndex).padStart(3, "0")}`;

    while (true) {
      const { data: existCode } = await supabase
        .from("payments")
        .select("id")
        .eq("payment_code", paymentCode)
        .maybeSingle();

      if (!existCode) break;
      payIndex++;
      paymentCode = `PAY-${String(payIndex).padStart(3, "0")}`;
    }

    const payDate = paymentDate || new Date().toISOString().split("T")[0];

    // Insert payment
    const { data: newPayment, error: payErr } = await supabase
      .from("payments")
      .insert({
        payment_code: paymentCode,
        employee_id: employee.id,
        payment_date: payDate,
        amount: payAmount,
        payment_method: normMethod,
        reference: reference ? reference.trim() : null,
        notes: notes ? notes.trim() : null,
        created_by: currentUser.id,
      })
      .select("id, payment_code, employee_id, payment_date, amount, payment_method, reference, notes, created_by, created_at")
      .single();

    if (payErr || !newPayment) {
      console.error("Insert payment error:", payErr);
      return errorResponse("Failed to create payment", "INSERT_FAILED", 500);
    }

    // FIFO Allocation
    let remainingPayment = payAmount;
    const paymentItemsToInsert = [];
    const workRecordUpdates: { id: number; newStatus: string }[] = [];

    for (const rec of recordsWithUnpaid) {
      if (remainingPayment <= 0.001) break;

      const allocation = Math.min(remainingPayment, rec.unpaid);
      remainingPayment -= allocation;

      paymentItemsToInsert.push({
        payment_id: newPayment.id,
        work_record_id: rec.id,
        amount_applied: allocation,
      });

      const newRemaining = rec.unpaid - allocation;
      const newStatus = newRemaining <= 0.001 ? "PAID" : "PARTIALLY_PAID";
      workRecordUpdates.push({ id: rec.id, newStatus });
    }

    if (paymentItemsToInsert.length > 0) {
      await supabase.from("payment_items").insert(paymentItemsToInsert);
    }

    for (const update of workRecordUpdates) {
      await supabase
        .from("work_records")
        .update({
          status: update.newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", update.id);
    }

    await logAudit(
      currentUser.id,
      "CREATE",
      "PAYMENT",
      newPayment.id,
      null,
      JSON.stringify({
        paymentCode: newPayment.payment_code,
        employeeId: employee.id,
        amount: newPayment.amount,
        paymentMethod: newPayment.payment_method,
      })
    );

    return successResponse(
      {
        id: newPayment.id,
        paymentCode: newPayment.payment_code,
        employeeId: newPayment.employee_id,
        employeeCode: employee.employee_code,
        employeeName: employee.name,
        paymentDate: newPayment.payment_date,
        amount: Number(newPayment.amount),
        paymentMethod: newPayment.payment_method,
        reference: newPayment.reference,
        notes: newPayment.notes,
        createdBy: newPayment.created_by,
        createdAt: newPayment.created_at,
      },
      "Payment created successfully",
      201
    );
  } catch (error) {
    console.error("Create payment exception:", error);
    return errorResponse("Failed to create payment", "INTERNAL_SERVER_ERROR", 500);
  }
}
