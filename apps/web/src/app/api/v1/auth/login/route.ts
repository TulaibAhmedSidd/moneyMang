import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { loginSchema } from "@money/shared";
import { isRateLimited } from "@/lib/rateLimit";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const limited = await isRateLimited(ip, "/api/v1/auth/login", 5, 60000); // 5 hits per minute
    if (limited) {
      return NextResponse.json(
        { success: false, message: "Too many login attempts. Please try again in 1 minute." },
        { status: 429 }
      );
    }

    await connectToDatabase();

    const body = await request.json();

    // Validate body using Zod schema
    const parseResult = loginSchema.safeParse(body);
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

    const { email, password } = parseResult.data;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Check status
    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        {
          success: false,
          message: "Your account has been suspended. Please contact support.",
        },
        { status: 403 }
      );
    }

    if (user.status === "DELETED") {
      return NextResponse.json(
        {
          success: false,
          message: "This account has been deleted.",
        },
        { status: 403 }
      );
    }

    // Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            preferredCurrency: user.preferredCurrency,
            onboardingCompleted: user.onboardingCompleted,
          },
        },
        message: "Logged in successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An internal server error occurred during login",
        errors: process.env.NODE_ENV === "development" ? [error.message] : [],
      },
      { status: 500 }
    );
  }
}
