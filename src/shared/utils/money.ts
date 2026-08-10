import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from "../constants/currencies";

/**
 * Converts a floating-point amount to integer minor units (e.g., $10.50 USD -> 1050 cents).
 */
export function toMinorUnits(amount: number, currency: string): number {
  const currencyUpper = currency.toUpperCase();
  const meta = SUPPORTED_CURRENCIES[currencyUpper] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
  const factor = Math.pow(10, meta.minorUnit);
  return Math.round(amount * factor);
}

/**
 * Converts integer minor units back to floating-point major units (e.g., 1050 cents -> $10.50 USD).
 */
export function toMajorUnits(amount: number, currency: string): number {
  const currencyUpper = currency.toUpperCase();
  const meta = SUPPORTED_CURRENCIES[currencyUpper] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
  const factor = Math.pow(10, meta.minorUnit);
  return amount / factor;
}

/**
 * Formats a minor-unit integer amount into a localized currency string.
 * Examples:
 * - 1250 USD -> "$12.50"
 * - 50000 PKR -> "Rs. 500.00"
 * - 500 JPY -> "¥500"
 */
export function formatMoney(amount: number, currency: string): string {
  const currencyUpper = currency.toUpperCase();
  const meta = SUPPORTED_CURRENCIES[currencyUpper] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
  const majorAmount = toMajorUnits(amount, currencyUpper);

  // If currency has minor units, format with correct fraction digits
  const fractionDigits = meta.minorUnit;

  if (currencyUpper === "PKR") {
    return `Rs. ${majorAmount.toFixed(fractionDigits)}`;
  }

  // Fallback to standard Intl formatting
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyUpper,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(majorAmount);
  } catch (error) {
    // If browser doesn't support the currency format
    return `${meta.symbol}${majorAmount.toFixed(fractionDigits)}`;
  }
}
