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
 * Formats a minor-unit integer amount into a localized currency string with commas.
 * Examples:
 * - 1250 USD -> "$12.50"
 * - 50000 PKR -> "Rs. 500.00"
 * - 500 JPY -> "¥500"
 */
export function formatMoney(amount: number, currency: string): string {
  const currencyUpper = currency.toUpperCase();
  const meta = SUPPORTED_CURRENCIES[currencyUpper] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
  const majorAmount = toMajorUnits(amount, currencyUpper);
  const fractionDigits = meta.minorUnit;

  if (currencyUpper === "PKR") {
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(majorAmount);
    return `Rs. ${formatted}`;
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
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(majorAmount);
    return `${meta.symbol}${formatted}`;
  }
}

/**
 * Formats a minor-unit integer amount into an abbreviated string (e.g., 1.38M, 108.2k).
 */
export function formatAbbreviated(amount: number, currency: string): string {
  const currencyUpper = currency.toUpperCase();
  const majorAmount = toMajorUnits(amount, currencyUpper);
  const abs = Math.abs(majorAmount);

  if (abs >= 10000000) {
    return `${(majorAmount / 10000000).toFixed(2)}Cr`; // Crore
  }
  if (abs >= 1000000) {
    return `${(majorAmount / 1000000).toFixed(2)}M`; // Million
  }
  if (abs >= 100000) {
    return `${(majorAmount / 100000).toFixed(2)}Lac`; // Lakh
  }
  if (abs >= 1000) {
    return `${(majorAmount / 1000).toFixed(1)}k`; // Thousand
  }
  return majorAmount.toFixed(2);
}

/**
 * Converts a minor-unit integer amount into a Roman Urdu spoken string (e.g., 13 lac 84 hazar 91).
 */
export function formatRomanUrdu(amount: number, currency: string): string {
  const currencyUpper = currency.toUpperCase();
  const majorAmount = Math.floor(toMajorUnits(amount, currencyUpper));
  
  if (majorAmount === 0) return "zero";
  
  let val = Math.abs(majorAmount);
  
  const crore = Math.floor(val / 10000000);
  val %= 10000000;
  
  const lac = Math.floor(val / 100000);
  val %= 100000;
  
  const hazar = Math.floor(val / 1000);
  val %= 1000;
  
  const sau = Math.floor(val / 100);
  val %= 100;
  
  const remaining = val;
  
  const parts: string[] = [];
  if (crore > 0) parts.push(`${crore} crore`);
  if (lac > 0) parts.push(`${lac} lac`);
  if (hazar > 0) parts.push(`${hazar} hazar`);
  if (sau > 0) parts.push(`${sau} sau`);
  if (remaining > 0 || parts.length === 0) parts.push(`${remaining}`);
  
  return parts.join(" ") + (majorAmount < 0 ? " negative" : "");
}
