import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";
import Category from "@/models/Category";
import { verifyAuth, AuthError } from "@/lib/auth";
import { transactionSchema } from "@/shared";
import { sanitizeObject } from "@/utils/sanitize";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    const payload = await verifyAuth(request);
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    // Pagination query parameters
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    const query: any = { userId: payload.userId };

    if (accountId) query.accountId = accountId;
    if (categoryId) query.categoryId = categoryId;
    if (type === "income" || type === "expense") query.type = type;

    // Date range filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Text search on title/description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate("accountId", "name type currency")
        .populate("categoryId", "name icon type"),
      Transaction.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          limit,
          offset,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/v1/transactions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await verifyAuth(request);
    await connectToDatabase();

    const idempotencyKey = request.headers.get("Idempotency-Key");

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existingTx = await Transaction.findOne({
        userId: payload.userId,
        idempotencyKey,
      })
        .populate("accountId", "name type currency")
        .populate("categoryId", "name icon type");

      if (existingTx) {
        return NextResponse.json(
          {
            success: true,
            data: existingTx,
            message: "Retrieved transaction from cache (idempotent)",
          },
          {
            status: 200,
            headers: {
              "X-Cache": "Idempotent",
            },
          }
        );
      }
    }

    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);

    // 2. Validate input schemas
    const parseResult = transactionSchema.safeParse(sanitizedBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parseResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { amount, type, categoryId, accountId, date, currency, title, description } = parseResult.data;

    // 3. Verify Account ownership & activity
    const account = await Account.findOne({
      _id: accountId,
      userId: payload.userId,
      isActive: true,
    });
    if (!account) {
      return NextResponse.json(
        { success: false, message: "Active account not found or access denied" },
        { status: 404 }
      );
    }

    // 4. Verify Category validity
    const category = await Category.findOne({
      _id: categoryId,
      $or: [{ isSystem: true }, { userId: payload.userId }],
      isArchived: false,
    });
    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found or access denied" },
        { status: 404 }
      );
    }

    // 5. Create transaction record
    const newTransaction = await Transaction.create({
      userId: payload.userId,
      accountId,
      categoryId,
      type,
      amount,
      currency,
      title: title.trim(),
      description: description?.trim(),
      date: new Date(date),
      idempotencyKey: idempotencyKey || new mongoose.Types.ObjectId().toString(),
    });

    const populatedTx = await Transaction.findById(newTransaction._id)
      .populate("accountId", "name type currency")
      .populate("categoryId", "name icon type");

    return NextResponse.json(
      {
        success: true,
        data: populatedTx,
        message: "Transaction created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    // Check for unique index constraints (idempotency key clash race condition)
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction submission is already being processed. Please refresh.",
          debugError: error.message || error.toString()
        },
        { status: 409 }
      );
    }
    console.error("POST /api/v1/transactions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
