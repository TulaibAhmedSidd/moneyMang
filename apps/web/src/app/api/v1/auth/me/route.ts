import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { verifyAuth, AuthError } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const payload = await verifyAuth(request);
    await connectToDatabase();

    const user = await User.findById(payload.userId).select("-passwordHash");
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/v1/auth/me error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await verifyAuth(request);
    await connectToDatabase();

    const body = await request.json();
    const { name, preferredCurrency, timezone, onboardingCompleted, weekStartsOn, theme } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (preferredCurrency !== undefined) updates.preferredCurrency = preferredCurrency;
    if (timezone !== undefined) updates.timezone = timezone;
    if (onboardingCompleted !== undefined) updates.onboardingCompleted = onboardingCompleted;
    if (weekStartsOn !== undefined) updates.weekStartsOn = weekStartsOn;
    if (theme !== undefined) updates.theme = theme;

    const user = await User.findByIdAndUpdate(
      payload.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: "Profile updated successfully",
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("PATCH /api/v1/auth/me error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
