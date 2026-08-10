import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

export const transactionTypeSchema = z.enum(["income", "expense"]);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

export const transactionSchema = z.object({
  amount: z.number().int("Amount must be an integer representing minor units").positive("Amount must be greater than zero"),
  type: transactionTypeSchema,
  categoryId: z.string().min(1, "Category ID is required"),
  accountId: z.string().min(1, "Account ID is required"),
  date: z.string().datetime({ message: "Invalid date format. Must be an ISO-8601 datetime string" }).or(z.date()),
  currency: z.string().refine((val) => val in SUPPORTED_CURRENCIES, {
    message: "Unsupported currency",
  }),
  title: z.string().min(1, "Title must be at least 1 character long").max(100, "Title cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
