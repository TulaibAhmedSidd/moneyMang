import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";
import Category from "@/models/Category";
import { verifyAuth, AuthError } from "@/lib/auth";
import { transactionSchema } from "@/shared";
import { sanitizeObject } from "@/utils/sanitize";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const payload = await verifyAuth(request);
    await connectToDatabase();

    const { id } = await params;

    const transaction = await Transaction.findOne({
      _id: id,
      userId: payload.userId,
    })
      .populate("accountId", "name type currency")
      .populate("categoryId", "name icon type");

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/v1/transactions/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const payload = await verifyAuth(request);
    await connectToDatabase();

    const { id } = await params;

    const transaction = await Transaction.findOne({
      _id: id,
      userId: payload.userId,
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);

    // Partial schema validation
    const partialSchema = transactionSchema.partial();
    const parseResult = partialSchema.safeParse(sanitizedBody);
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

    const updates = parseResult.data;

    // Check account validity if changing account
    if (updates.accountId) {
      const account = await Account.findOne({
        _id: updates.accountId,
        userId: payload.userId,
        isActive: true,
      });
      if (!account) {
        return NextResponse.json(
          { success: false, message: "Account not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Check category validity if changing category
    if (updates.categoryId) {
      const category = await Category.findOne({
        _id: updates.categoryId,
        $or: [{ isSystem: true }, { userId: payload.userId }],
        isArchived: false,
      });
      if (!category) {
        return NextResponse.json(
          { success: false, message: "Category not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Apply updates
    if (updates.amount !== undefined) transaction.amount = updates.amount;
    if (updates.type !== undefined) transaction.type = updates.type;
    if (updates.accountId !== undefined) transaction.accountId = updates.accountId as any;
    if (updates.categoryId !== undefined) transaction.categoryId = updates.categoryId as any;
    if (updates.currency !== undefined) transaction.currency = updates.currency;
    if (updates.title !== undefined) transaction.title = updates.title.trim();
    if (updates.description !== undefined) transaction.description = updates.description.trim();
    if (updates.date !== undefined) transaction.date = new Date(updates.date);

    await transaction.save();

    const updatedTx = await Transaction.findById(id)
      .populate("accountId", "name type currency")
      .populate("categoryId", "name icon type");

    return NextResponse.json({
      success: true,
      data: updatedTx,
      message: "Transaction updated successfully",
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("PATCH /api/v1/transactions/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const payload = await verifyAuth(request);
    await connectToDatabase();

    const { id } = await params;

    const result = await Transaction.deleteOne({
      _id: id,
      userId: payload.userId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Transaction not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("DELETE /api/v1/transactions/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
