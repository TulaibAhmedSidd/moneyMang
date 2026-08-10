import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Transaction from "@/models/Transaction";
import { verifyAuth, AuthError } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    const payload = await verifyAuth(request);
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Fallback date range: current month
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const startDate = startDateParam ? new Date(startDateParam) : defaultStart;
    const endDate = endDateParam ? new Date(endDateParam) : defaultEnd;

    const userId = new mongoose.Types.ObjectId(payload.userId);

    // 1. Group by category for Expenses
    const categoryAgg = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "expense",
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$categoryId",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      // Join Category details
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $project: {
          _id: 1,
          amount: 1,
          count: 1,
          name: "$category.name",
          icon: "$category.icon",
          type: "$category.type",
        },
      },
      { $sort: { amount: -1 } },
    ]);

    // 2. Trend statistics (Daily spending & income)
    const trendAgg = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            type: "$type",
          },
          amount: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: "$_id.day",
          income: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "income"] }, "$amount", 0],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "expense"] }, "$amount", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 3. Comparison with previous period
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const prevStartDate = new Date(startDate.getTime() - diffTime);
    const prevEndDate = new Date(endDate.getTime() - diffTime);

    const [currentTotals, previousTotals] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            userId,
            type: "expense",
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId,
            type: "expense",
            date: { $gte: prevStartDate, $lte: prevEndDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const currentExpenseTotal = currentTotals[0]?.total || 0;
    const previousExpenseTotal = previousTotals[0]?.total || 0;

    let percentageChange = 0;
    if (previousExpenseTotal > 0) {
      percentageChange = ((currentExpenseTotal - previousExpenseTotal) / previousExpenseTotal) * 100;
    }

    return NextResponse.json({
      success: true,
      data: {
        categories: categoryAgg,
        trends: trendAgg.map((row) => ({
          date: row._id,
          income: row.income,
          expense: row.expense,
        })),
        comparison: {
          currentPeriodTotal: currentExpenseTotal,
          previousPeriodTotal: previousExpenseTotal,
          percentageChange: parseFloat(percentageChange.toFixed(1)),
        },
      },
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/v1/analytics/spending error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate spending analytics" },
      { status: 500 }
    );
  }
}
