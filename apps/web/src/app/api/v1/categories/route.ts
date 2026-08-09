import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Category from "@/models/Category";
import { verifyAuth, AuthError } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const payload = await verifyAuth(request);
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // optional type filter: income/expense

    const query: any = {
      $or: [
        { isSystem: true },
        { userId: payload.userId }
      ],
      isArchived: false,
    };

    if (type === "income" || type === "expense") {
      query.type = type;
    }

    const categories = await Category.find(query).sort({
      sortOrder: 1,
      name: 1,
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/v1/categories error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await verifyAuth(request);
    await connectToDatabase();

    const body = await request.json();
    const { name, icon, type } = body;

    // Validation checks
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Category name must be a non-empty string" },
        { status: 400 }
      );
    }

    if (!icon || typeof icon !== "string" || icon.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Category icon is required" },
        { status: 400 }
      );
    }

    if (type !== "income" && type !== "expense") {
      return NextResponse.json(
        { success: false, message: "Category type must be 'income' or 'expense'" },
        { status: 400 }
      );
    }

    // Check for duplicate custom category for this user
    const existing = await Category.findOne({
      userId: payload.userId,
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      isArchived: false,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "A custom category with this name already exists" },
        { status: 409 }
      );
    }

    const newCategory = await Category.create({
      userId: payload.userId,
      name: name.trim(),
      icon: icon.trim(),
      type,
      isSystem: false,
      isArchived: false,
      sortOrder: 100, // custom categories placed after system categories
    });

    return NextResponse.json(
      {
        success: true,
        data: newCategory,
        message: "Category created successfully",
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
    console.error("POST /api/v1/categories error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create category" },
      { status: 500 }
    );
  }
}
