import { NextRequest } from "next/server";
import { getAuthenticatedUser, logAudit } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse, safeServerError } from "@/lib/apiResponse";
import { isValidId, sanitizeInput, sanitizeNullable } from "@/lib/security";

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
      settle_in_full,
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

  if (employeeId && isValidId(employeeId)) {
    query = query.eq("employee_id", Number(employeeId));
  }
  if (startDate && startDate.trim()) {
    query = query.gte("payment_date", sanitizeInput(startDate));
  }
  if (endDate && endDate.trim()) {
    query = query.lte("payment_date", sanitizeInput(endDate));
  }

  const { data: payments, error } = await query;
  if (error) {
    return safeServerError(error, "Failed to fetch payments", "FETCH_FAILED");
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
      settleInFull: Boolean(p.settle_in_full),
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
    const settleInFull =
      body.settleInFull !== undefined ? Boolean(body.settleInFull) : true;

    if (!employeeId || !isValidId(employeeId)) {
      return errorResponse("Valid employee ID is required", "INVALID_EMPLOYEE_ID", 400);
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
      .select("id, work_date, amount, status, waived_amount")
      .eq("employee_id", employee.id)
      .in("status", ["UNPAID", "STORED", "PARTIALLY_PAID"])
      .order("work_date", { ascending: true })
      .order("id", { ascending: true });

    if (wrErr) {
      return safeServerError(wrErr, "Failed to fetch work records", "FETCH_FAILED");
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
      const waived = Number(r.waived_amount || 0);
      const unpaid = Math.max(0, Number(r.amount) - applied - waived);
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

    const cleanPaymentDate = paymentDate ? sanitizeInput(paymentDate) : new Date().toISOString().slice(0, 10);
    const sanitizedReference = sanitizeNullable(reference);
    const sanitizedNotes = sanitizeNullable(notes);

    const { data: newPayment, error: payErr } = await supabase
      .from("payments")
      .insert({
        payment_code: paymentCode,
        employee_id: employee.id,
        payment_date: cleanPaymentDate,
        amount: payAmount,
        payment_method: normMethod,
        reference: sanitizedReference || null,
        notes: sanitizedNotes || null,
        settle_in_full: settleInFull,
        created_by: currentUser.id,
      })
      .select("id, payment_code, employee_id, payment_date, amount, payment_method, reference, notes, settle_in_full, created_by, created_at")
      .single();

    if (payErr || !newPayment) {
      return safeServerError(payErr, "Failed to record payment", "INSERT_FAILED");
    }

    // FIFO allocation to work records
    let remainingPayment = payAmount;
    const paymentItemsToInsert: { payment_id: number; work_record_id: number; amount_applied: number }[] = [];
    const workRecordUpdates: { id: number; newStatus: string; waivedAmount: number }[] = [];

    for (const rec of recordsWithUnpaid) {
      if (remainingPayment <= 0.001) break;

      const allocation = Math.min(remainingPayment, rec.unpaid);
      remainingPayment = Number((remainingPayment - allocation).toFixed(2));

      paymentItemsToInsert.push({
        payment_id: newPayment.id,
        work_record_id: rec.id,
        amount_applied: Number(allocation.toFixed(2)),
      });

      if (settleInFull) {
        const waivedForRecord = Number(Math.max(0, rec.unpaid - allocation).toFixed(2));
        workRecordUpdates.push({
          id: rec.id,
          newStatus: "PAID",
          waivedAmount: waivedForRecord,
        });
      } else {
        const isFullyCovered = allocation >= rec.unpaid - 0.001;
        const newStatus = isFullyCovered ? "PAID" : "PARTIALLY_PAID";
        workRecordUpdates.push({
          id: rec.id,
          newStatus,
          waivedAmount: 0,
        });
      }
    }

    if (paymentItemsToInsert.length > 0) {
      await supabase.from("payment_items").insert(paymentItemsToInsert);
    }

    for (const update of workRecordUpdates) {
      await supabase
        .from("work_records")
        .update({
          status: update.newStatus,
          waived_amount: update.waivedAmount,
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
        settleInFull: newPayment.settle_in_full,
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
        settleInFull: Boolean(newPayment.settle_in_full),
        createdBy: newPayment.created_by,
        createdAt: newPayment.created_at,
      },
      "Payment created successfully",
      201
    );
  } catch (error) {
    return safeServerError(error, "Failed to create payment");
  }
}
