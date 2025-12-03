/**
 * Extracts the university slug from an email address
 * @param email - Email address (e.g., user@sjsu.edu)
 * @returns University slug (e.g., "sjsu")
 */
export function extractUniversitySlug(email: string): string {
  const domain = email.split('@')[1];        // "sjsu.edu"
  return domain.split('.')[0].toLowerCase(); // "sjsu"
}

// CommonJS export for compatibility
module.exports = { extractUniversitySlug };

