import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { requireRole, AuthError } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Restrict access to admin roles
    await requireRole(request, ["ADMIN", "SUPER_ADMIN"]);
    await connectToDatabase();

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalTx,
      globalVolumeRes,
      latestTx,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "ACTIVE" }),
      User.countDocuments({ status: "SUSPENDED" }),
      Transaction.countDocuments(),
      Transaction.aggregate([
        {
          $group: {
            _id: null,
            totalVolume: { $sum: "$amount" },
          },
        },
      ]),
      Transaction.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userId", "name email")
        .populate("categoryId", "name icon type"),
    ]);

    const totalVolume = globalVolumeRes[0]?.totalVolume || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalTransactions: totalTx,
        globalVolume: totalVolume,
        latestTransactions: latestTx,
      },
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/v1/admin/stats error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
