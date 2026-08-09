import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { requireRole, AuthError } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const payload = await requireRole(request, ["ADMIN", "SUPER_ADMIN"]);
    await connectToDatabase();

    const { id } = await params;

    // Prevent modifying oneself
    if (payload.userId === id) {
      return NextResponse.json(
        { success: false, message: "You cannot modify your own administrative account settings" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { role, status } = body;

    const updates: any = {};
    if (role !== undefined) {
      const allowedRoles = ["SUPER_ADMIN", "ADMIN", "SUPPORT", "ANALYST", "MODERATOR", "USER"];
      if (!allowedRoles.includes(role)) {
        return NextResponse.json(
          { success: false, message: "Invalid role specified" },
          { status: 400 }
        );
      }
      updates.role = role;
    }

    if (status !== undefined) {
      const allowedStatus = ["ACTIVE", "SUSPENDED", "DELETED", "PENDING_VERIFICATION"];
      if (!allowedStatus.includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid status specified" },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "No update parameters provided" },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
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
      message: "User settings updated successfully",
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("PATCH /api/v1/admin/users/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
