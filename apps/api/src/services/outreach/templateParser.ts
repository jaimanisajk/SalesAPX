/**
 * Merge template variable parser.
 * Interpolates custom merge tags like {{firstName}} or {{companyName || 'your company'}}
 * with actual lead or sender data.
 */
export function parseTemplate(
  templateText: string,
  lead: any,
  senderName: string = "our team"
): string {
  if (!templateText) return "";

  // Regular expression to match tags like:
  // - {{firstName}}
  // - {{companyName || 'your company'}}
  // - {{jobTitle || 'relevant role'}}
  const tagRegex = /\{\{\s*(\w+)(?:\s*\|\|\s*'([^']*)')?\s*\}\}/g;

  return templateText.replace(tagRegex, (match, key, fallback) => {
    // 1. Resolve key mappings
    let value = "";
    if (key === "senderName") {
      value = senderName;
    } else if (lead && key in lead) {
      value = lead[key];
    }

    // 2. Return value or fallback
    if (value && String(value).trim() !== "") {
      return String(value).trim();
    }
    
    return fallback !== undefined ? fallback : "";
  });
}
