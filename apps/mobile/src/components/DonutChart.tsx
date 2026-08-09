import React from "react";
import { View, StyleSheet, Text } from "react-native";
import Svg, { G, Circle } from "react-native-svg";
import { useTheme } from "../../app/_layout";

interface DonutChartProps {
  data: {
    name: string;
    amount: number;
    color: string;
  }[];
  total: number;
  currencySymbol: string;
}

export default function DonutChart({ data, total, currencySymbol }: DonutChartProps) {
  const { colors } = useTheme();
  
  const radius = 60;
  const strokeWidth = 14;
  const size = (radius + strokeWidth) * 2;
  const circumference = 2 * Math.PI * radius;

  // Filter out zero amount items
  const validData = data.filter((item) => item.amount > 0);

  let accumulatedPercent = 0;

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {/* Background track circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.border}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Segments */}
            {validData.map((item, index) => {
              const percentage = total > 0 ? item.amount / total : 0;
              const strokeDashoffset = circumference - (circumference * percentage);
              const rotationAngle = (accumulatedPercent * 360);
              accumulatedPercent += percentage;

              return (
                <Circle
                  key={`${item.name}-${index}`}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  rotation={rotationAngle}
                  origin={`${size / 2}, ${size / 2}`}
                  strokeLinecap="round"
                />
              );
            })}
          </G>
        </Svg>
        {/* Center label */}
        <View style={styles.labelContainer}>
          <Text style={[styles.labelText, { color: colors.textSecondary }]}>Total</Text>
          <Text style={[styles.totalText, { color: colors.text }]} numberOfLines={1}>
            {currencySymbol}{(total / 100).toFixed(0)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  chartWrapper: {
    position: "relative",
    width: 148,
    height: 148,
    alignItems: "center",
    justifyContent: "center",
  },
  labelContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  totalText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
    maxWidth: 90,
  },
});
