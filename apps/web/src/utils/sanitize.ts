/**
 * Sanitizes a string by stripping HTML tags and escape sequences to protect against XSS injections.
 */
export function sanitizeText(text: string): string {
  if (typeof text !== "string") return text;
  
  return text
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/javascript:/gi, "") // strip javascript: schemes
    .replace(/[&<>"']/g, (match) => {
      const escapeMap: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
      };
      return escapeMap[match] || match;
    })
    .trim();
}

/**
 * Recursively walks an object and sanitizes all string properties.
 */
export function sanitizeObject<T>(obj: T): T {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (typeof val === "string") {
      result[key] = sanitizeText(val);
    } else if (typeof val === "object" && val !== null) {
      result[key] = sanitizeObject(val);
    } else {
      result[key] = val;
    }
  }

  return result as T;
}
