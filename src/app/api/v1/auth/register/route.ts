import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Account from "@/models/Account";
import { registerSchema } from "@/shared";
import { sendVerificationEmail } from "@/services/email";
import { isRateLimited } from "@/lib/rateLimit";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const limited = await isRateLimited(ip, "/api/v1/auth/register", 15, 60000); // 15 attempts per minute max
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
      const fieldErrors = parseResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      const detailedMessage = fieldErrors.map((e) => e.message).join(". ");
      return NextResponse.json(
        {
          success: false,
          message: detailedMessage || "Validation failed",
          errors: fieldErrors,
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
          message: "This email address is already registered. Please sign in instead.",
        },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create random email verification token (for future verification if enabled)
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    // Create user in ACTIVE status so they can use the app immediately
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      authProviders: ["local"],
      emailVerified: true,
      role: "USER",
      permissions: [],
      status: "ACTIVE",
      preferredCurrency: "PKR",
      locale: "en",
      timezone: "Asia/Karachi",
      weekStartsOn: 0,
      onboardingCompleted: true,
    });

    // Create a default "Cash" account so new user can immediately log transactions
    await Account.create({
      userId: newUser._id,
      name: "Cash",
      type: "cash",
      currency: "PKR",
      initialBalance: 0,
      isActive: true,
    });

    // Generate JWT token for seamless auto-login
    const token = jwt.sign(
      {
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Attempt verification email if SMTP is configured
    sendVerificationEmail(newUser.email, newUser.name, emailVerificationToken).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        data: {
          token,
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            status: newUser.status,
            role: newUser.role,
            preferredCurrency: newUser.preferredCurrency,
            onboardingCompleted: newUser.onboardingCompleted,
          },
        },
        message: "User registered successfully.",
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
