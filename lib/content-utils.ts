export function extractTextPreview(content: any, maxLength: number = 100): string {
  try {
    if (!content) return "No content";

    if (typeof content === "string") {
      // If it's HTML string (from CKEditor), strip tags
      if (content.includes("<")) {
        const plainText = stripHtmlTags(content);
        return plainText.substring(0, maxLength);
      }
      return content.substring(0, maxLength);
    }

    // Fallback for other formats
    return JSON.stringify(content)
      .substring(0, maxLength)
      .replace(/"/g, "")
      .replace(/[{}[\]]/g, "");
  } catch {
    return "No content";
  }
}

export function stripHtmlTags(html: string): string {
  // Remove HTML tags and decode entities
  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
