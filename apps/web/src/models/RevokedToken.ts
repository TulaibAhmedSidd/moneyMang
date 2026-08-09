import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRevokedToken extends Document {
  token: string;
  expiresAt: Date;
}

const RevokedTokenSchema = new Schema(
  {
    token: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  {
    timestamps: true,
  }
);

const RevokedToken: Model<IRevokedToken> =
  mongoose.models.RevokedToken || mongoose.model<IRevokedToken>("RevokedToken", RevokedTokenSchema);

export default RevokedToken;
