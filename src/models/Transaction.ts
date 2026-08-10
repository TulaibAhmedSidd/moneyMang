import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  type: "income" | "expense";
  amount: number; // Integer minor units (e.g. 1000 for $10.00)
  currency: string;
  title: string;
  description?: string;
  date: Date;
  idempotencyKey?: string; // Optional idempotency token to guard transactions
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date, required: true, index: true },
    idempotencyKey: { type: String, index: true },
  },
  {
    timestamps: true,
  }
);

// Compound indexes as requested by prompt.txt for efficient queries and analytics
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1, date: -1 });
TransactionSchema.index({ userId: 1, categoryId: 1, date: -1 });
TransactionSchema.index({ userId: 1, accountId: 1, date: -1 });

// Unique index for idempotency keys per user to prevent duplicate posts
TransactionSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
