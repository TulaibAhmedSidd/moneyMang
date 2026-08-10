import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Account from "@/models/Account";
import { verifyAuth, AuthError } from "@/lib/auth";
import { SUPPORTED_CURRENCIES } from "@/shared";
import { calculateUserBalances } from "@/services/balance";

export async function GET(request: Request) {
  try {
    const payload = await verifyAuth(request);
    await connectToDatabase();

    const [accounts, liveBalances] = await Promise.all([
      Account.find({
        userId: payload.userId,
        isActive: true,
      }).sort({ createdAt: -1 }),
      calculateUserBalances(payload.userId),
    ]);

    const accountsWithBalance = accounts.map((account) => {
      const obj = account.toObject();
      return {
        ...obj,
        balance: liveBalances[account._id.toString()] ?? account.initialBalance,
      };
    });

    return NextResponse.json({
      success: true,
      data: accountsWithBalance,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/v1/accounts error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await verifyAuth(request);
    await connectToDatabase();

    const body = await request.json();

    const { name, type, currency, initialBalance } = body;

    // Manual validation since it is a simple schema
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, message: "Account name must be a non-empty string" },
        { status: 400 }
      );
    }
    if (!type || typeof type !== "string") {
      return NextResponse.json(
        { success: false, message: "Account type is required" },
        { status: 400 }
      );
    }
    if (!currency || typeof currency !== "string" || !(currency.toUpperCase() in SUPPORTED_CURRENCIES)) {
      return NextResponse.json(
        { success: false, message: "Valid currency is required" },
        { status: 400 }
      );
    }
    if (initialBalance === undefined || typeof initialBalance !== "number") {
      return NextResponse.json(
        { success: false, message: "Initial balance must be a number representing minor units" },
        { status: 400 }
      );
    }

    const newAccount = await Account.create({
      userId: payload.userId,
      name: name.trim(),
      type: type.trim(),
      currency: currency.toUpperCase().trim(),
      initialBalance: Math.round(initialBalance),
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        data: newAccount,
        message: "Account created successfully",
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
    console.error("POST /api/v1/accounts error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create account" },
      { status: 500 }
    );
  }
}
