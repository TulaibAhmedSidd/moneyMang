import jwt from "jsonwebtoken";
import User, { IUser } from "@/models/User";
import { connectToDatabase } from "./db";
import RevokedToken from "@/models/RevokedToken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
}

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

/**
 * Extracts and verifies the JWT token from the request's Authorization header.
 * Throws AuthError if token is missing, invalid, or expired.
 */
export async function verifyAuth(request: Request): Promise<DecodedToken> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError("Authorization token required", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    await connectToDatabase();
    const isRevoked = await RevokedToken.findOne({ token });
    if (isRevoked) {
      throw new AuthError("Session expired or token revoked. Please log in again.", 401);
    }

    return decoded;
  } catch (error: any) {
    if (error instanceof AuthError) throw error;
    if (error.name === "TokenExpiredError") {
      throw new AuthError("Session expired. Please log in again.", 401);
    }
    throw new AuthError("Invalid authorization token", 401);
  }
}

/**
 * Verifies that the user has one of the allowed roles.
 * Throws AuthError if unauthorized.
 */
export async function requireRole(request: Request, allowedRoles: string[]): Promise<DecodedToken> {
  const payload = await verifyAuth(request);

  if (!allowedRoles.includes(payload.role)) {
    throw new AuthError("You do not have permission to perform this action", 403);
  }

  return payload;
}

/**
 * Fetches the user from database and checks if they have a specific permission,
 * or if they are SUPER_ADMIN (who has implicit permissions).
 * Throws AuthError if verification fails.
 */
export async function requirePermission(request: Request, requiredPermission: string): Promise<IUser> {
  const payload = await verifyAuth(request);

  await connectToDatabase();
  const user = await User.findById(payload.userId);

  if (!user) {
    throw new AuthError("User not found", 401);
  }

  if (user.status === "SUSPENDED") {
    throw new AuthError("Your account has been suspended", 403);
  }

  // SUPER_ADMIN bypasses all permission checks
  if (user.role === "SUPER_ADMIN") {
    return user;
  }

  // Check explicit permissions
  const hasPermission = user.permissions.includes(requiredPermission);
  if (!hasPermission) {
    throw new AuthError(`Missing required permission: ${requiredPermission}`, 403);
  }

  return user;
}
