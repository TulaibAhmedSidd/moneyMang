import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICategory extends Document {
  userId?: mongoose.Types.ObjectId | null; // null for system/global categories
  name: string;
  icon: string;
  type: "income" | "expense";
  isSystem: boolean;
  isArchived: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema<ICategory> = new Schema<ICategory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    icon: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
      index: true,
    },
    isSystem: { type: Boolean, default: false, index: true },
    isArchived: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure fast search/sorting and check uniqueness per user
CategorySchema.index({ userId: 1, name: 1 });

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
