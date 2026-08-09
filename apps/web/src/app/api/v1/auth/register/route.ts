import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { registerSchema } from "@money/shared";
import { sendVerificationEmail } from "@/services/email";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const limited = await isRateLimited(ip, "/api/v1/auth/register", 3, 60000); // 3 hits per minute max
    if (limited) {
      return NextResponse.json(
        { success: false, message: "Too many registration attempts. Please try again in 1 minute." },
        { status: 429 }
      );
    }

    await connectToDatabase();

    const body = await request.json();

    // Validate body using Zod schema
    const parseResult = registerSchema.safeParse(body);
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

    const { name, email, password } = parseResult.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is already registered",
        },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create random email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    // Create user in PENDING_VERIFICATION status
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      authProviders: ["local"],
      emailVerified: false,
      role: "USER",
      permissions: [],
      status: "PENDING_VERIFICATION",
      preferredCurrency: "USD",
      locale: "en",
      timezone: "UTC",
      weekStartsOn: 0,
      onboardingCompleted: false,
    });

    // Send verification email (non-blocking or handled async)
    // We send it and check success, but we won't block register if SMTP is missing
    const emailSent = await sendVerificationEmail(
      newUser.email,
      newUser.name,
      emailVerificationToken
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            status: newUser.status,
            role: newUser.role,
          },
        },
        message: emailSent
          ? "User registered successfully. Please check your email to verify your account."
          : "User registered successfully. (Email verification pending configuration).",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An internal server error occurred during registration",
        errors: process.env.NODE_ENV === "development" ? [error.message] : [],
      },
      { status: 500 }
    );
  }
}
