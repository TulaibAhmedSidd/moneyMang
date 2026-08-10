import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: string; // e.g. "Cash", "Bank", "Savings", "Credit Card"
  currency: string;
  initialBalance: number; // Integer minor units (e.g. 1000 for $10.00)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema: Schema<IAccount> = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    currency: { type: String, required: true, uppercase: true, trim: true },
    initialBalance: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Compound index to speed up sorting and pagination by user
AccountSchema.index({ userId: 1, createdAt: 1 });

const Account: Model<IAccount> =
  mongoose.models.Account || mongoose.model<IAccount>("Account", AccountSchema);

export default Account;
