export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  minorUnit: number; // 2 for cents/paise, 0 for yen, etc.
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  PKR: { code: "PKR", symbol: "Rs.", name: "Pakistani Rupee", minorUnit: 2 },
  USD: { code: "USD", symbol: "$", name: "United States Dollar", minorUnit: 2 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", minorUnit: 2 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound Sterling", minorUnit: 2 },
  AED: { code: "AED", symbol: "د.إ", name: "United Arab Emirates Dirham", minorUnit: 2 },
  SAR: { code: "SAR", symbol: "ر.س", name: "Saudi Riyal", minorUnit: 2 },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", minorUnit: 2 },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar", minorUnit: 2 },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", minorUnit: 2 },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen", minorUnit: 0 },
  CNY: { code: "CNY", symbol: "¥", name: "Chinese Yuan", minorUnit: 2 },
};

export const DEFAULT_CURRENCY = "USD";
