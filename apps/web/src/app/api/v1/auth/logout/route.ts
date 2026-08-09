import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { verifyAuth, AuthError } from "@/lib/auth";
import RevokedToken from "@/models/RevokedToken";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    // 1. Verify token
    const payload = await verifyAuth(request);
    await connectToDatabase();

    // 2. Extract token string
    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.split(" ")[1];

    // Decode token to get expiry timestamp
    const decoded: any = jwt.decode(token);
    const expiresAt = decoded && decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 3. Store in blacklist
    await RevokedToken.create({
      token,
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      message: "Logged out and token revoked successfully",
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/v1/auth/logout error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
