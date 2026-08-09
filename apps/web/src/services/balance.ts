import mongoose from "mongoose";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";

/**
 * Computes the live balance of a single account dynamically:
 * balance = initialBalance + Sum(incomes) - Sum(expenses)
 */
export async function calculateAccountBalance(accountId: string): Promise<number> {
  const account = await Account.findById(accountId);
  if (!account) {
    throw new Error("Account not found");
  }

  const result = await Transaction.aggregate([
    { $match: { accountId: new mongoose.Types.ObjectId(accountId) } },
    {
      $group: {
        _id: "$accountId",
        netChange: {
          $sum: {
            $cond: [
              { $eq: ["$type", "income"] },
              "$amount",
              { $subtract: [0, "$amount"] }, // negative amount for expenses
            ],
          },
        },
      },
    },
  ]);

  const netChange = result[0]?.netChange || 0;
  return account.initialBalance + netChange;
}

/**
 * Computes live balances for all accounts of a user in a single aggregation pipeline.
 * Returns a mapping of accountId -> liveBalance
 */
export async function calculateUserBalances(userId: string): Promise<Record<string, number>> {
  const accounts = await Account.find({ userId, isActive: true });
  const accountIds = accounts.map((acc) => acc._id);

  const results = await Transaction.aggregate([
    {
      $match: {
        accountId: { $in: accountIds.map((id) => new mongoose.Types.ObjectId(id.toString())) },
      },
    },
    {
      $group: {
        _id: "$accountId",
        netChange: {
          $sum: {
            $cond: [
              { $eq: ["$type", "income"] },
              "$amount",
              { $subtract: [0, "$amount"] },
            ],
          },
        },
      },
    },
  ]);

  const balanceChanges: Record<string, number> = {};
  results.forEach((row) => {
    balanceChanges[row._id.toString()] = row.netChange;
  });

  const finalBalances: Record<string, number> = {};
  accounts.forEach((acc) => {
    const change = balanceChanges[acc._id.toString()] || 0;
    finalBalances[acc._id.toString()] = acc.initialBalance + change;
  });

  return finalBalances;
}
