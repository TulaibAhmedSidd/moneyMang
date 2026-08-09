import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  avatar?: string;
  authProviders: string[]; // ["local", "google", etc.]
  emailVerified: boolean;
  role: "SUPER_ADMIN" | "ADMIN" | "SUPPORT" | "ANALYST" | "MODERATOR" | "USER";
  permissions: string[];
  status: "ACTIVE" | "SUSPENDED" | "DELETED" | "PENDING_VERIFICATION";
  preferredCurrency: string;
  locale: string;
  timezone: string;
  weekStartsOn: number; // 0 = Sunday, 1 = Monday, etc.
  onboardingCompleted: boolean;
  theme: "light" | "dark" | "system";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String },
    avatar: { type: String },
    authProviders: { type: [String], default: ["local"] },
    emailVerified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "ANALYST", "MODERATOR", "USER"],
      default: "USER",
    },
    permissions: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "DELETED", "PENDING_VERIFICATION"],
      default: "PENDING_VERIFICATION",
      index: true,
    },
    preferredCurrency: { type: String, default: "USD" },
    locale: { type: String, default: "en" },
    timezone: { type: String, default: "UTC" },
    weekStartsOn: { type: Number, default: 0 },
    onboardingCompleted: { type: Boolean, default: false },
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
  },
  {
    timestamps: true,
  }
);

// Prevent compiling model multiple times during Next.js hot-reloads
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
