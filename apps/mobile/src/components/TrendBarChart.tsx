import React from "react";
import { View, StyleSheet, Text } from "react-native";
import Svg, { Rect, Line, G } from "react-native-svg";
import { useTheme } from "../../app/_layout";

interface TrendBarChartProps {
  data: {
    date: string;
    income: number;
    expense: number;
  }[];
}

export default function TrendBarChart({ data }: TrendBarChartProps) {
  const { colors } = useTheme();

  const chartHeight = 150;
  const paddingBottom = 24;
  const containerHeight = chartHeight + paddingBottom;

  // Calculate scaling factor
  const maxVal = Math.max(
    ...data.map((item) => Math.max(item.income, item.expense)),
    1000 // avoid division by zero or super tiny values
  );

  const formatLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      // Format to show day number or day name
      return d.toLocaleDateString(undefined, { day: "numeric" });
    } catch {
      return "";
    }
  };

  const chartWidth = 280;
  const numItems = data.length || 1;
  const step = chartWidth / numItems;
  const barWidth = Math.max(step * 0.3, 4);

  return (
    <View style={styles.container}>
      <Svg width="100%" height={containerHeight} viewBox={`0 0 ${chartWidth} ${containerHeight}`}>
        {/* Baseline */}
        <Line
          x1="0"
          y1={chartHeight}
          x2={chartWidth}
          y2={chartHeight}
          stroke={colors.border}
          strokeWidth="1"
        />

        {data.map((item, idx) => {
          const x = idx * step + step / 2;
          
          // Scaled heights
          const incomeHeight = (item.income / maxVal) * (chartHeight - 10);
          const expenseHeight = (item.expense / maxVal) * (chartHeight - 10);

          return (
            <G key={`trend-${item.date}-${idx}`}>
              {/* Income bar */}
              <Rect
                x={x - barWidth - 1}
                y={chartHeight - incomeHeight}
                width={barWidth}
                height={incomeHeight}
                fill={colors.success}
                rx={2}
              />
              {/* Expense bar */}
              <Rect
                x={x + 1}
                y={chartHeight - expenseHeight}
                width={barWidth}
                height={expenseHeight}
                fill={colors.error}
                rx={2}
              />
            </G>
          );
        })}
      </Svg>

      {/* X Axis Labels */}
      <View style={styles.labelsRow}>
        {data.map((item, idx) => (
          <Text
            key={`lbl-${idx}`}
            style={[styles.label, { width: `${100 / numItems}%`, color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {formatLabel(item.date)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
  },
  labelsRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 6,
    justifyContent: "space-around",
  },
  label: {
    fontSize: 9,
    textAlign: "center",
    fontWeight: "500",
  },
});
