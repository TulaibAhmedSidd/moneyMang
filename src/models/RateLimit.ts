import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRateLimit extends Document {
  key: string;
  hits: number;
  resetAt: Date;
}

const RateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    hits: { type: Number, required: true, default: 1 },
    resetAt: { type: Date, required: true, expires: 0 },
  },
  {
    timestamps: true,
  }
);

const RateLimit: Model<IRateLimit> =
  mongoose.models.RateLimit || mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);

export default RateLimit;
