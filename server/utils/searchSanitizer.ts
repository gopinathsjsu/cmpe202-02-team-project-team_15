/**
 * Search Query Sanitization Utility
 * Protects against malicious patterns, performance issues, and regex injection
 */

interface SanitizedSearchQuery {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'createdAt_desc' | 'createdAt_asc' | 'price_desc' | 'price_asc';
  page: number;
  pageSize: number;
}

interface ValidationResult {
  isValid: boolean;
  sanitized?: SanitizedSearchQuery;
  error?: string;
}

// Configuration constants
const SEARCH_CONFIG = {
  MAX_QUERY_LENGTH: 100,           // Maximum search query length
  MAX_PAGE_SIZE: 100,               // Maximum items per page
  DEFAULT_PAGE_SIZE: 20,            // Default items per page
  MAX_PRICE: 1000000,               // Maximum price value
  MIN_PRICE: 0,                     // Minimum price value
  MAX_PAGE_NUMBER: 1000,            // Maximum page number to prevent memory issues
  
  // Regex patterns to block
  BLOCKED_PATTERNS: [
    /[\$\{\}]/g,                    // MongoDB operators
    /\.\*/g,                        // Greedy regex patterns
    /\.\+/g,                        // Greedy regex patterns
    /\\x[0-9a-fA-F]{2}/g,          // Hex escapes
    /\\u[0-9a-fA-F]{4}/g,          // Unicode escapes
    /[\x00-\x1f\x7f-\x9f]/g,       // Control characters
    /<script|javascript:/gi,        // XSS attempts
    /(\(.*\)){5,}/g,                // Excessive parentheses (potential ReDoS)
    /(\[.*\]){5,}/g,                // Excessive brackets (potential ReDoS)
  ],
  
  // Special regex characters that need escaping
  REGEX_SPECIAL_CHARS: /[.*+?^${}()|[\]\\]/g,
};

/**
 * Sanitize search query text
 * Removes malicious patterns and limits length
 */
export const sanitizeSearchQuery = (query: string | undefined): { sanitized?: string; error?: string } => {
  if (!query || typeof query !== 'string') {
    return { sanitized: undefined };
  }

  // Trim whitespace
  let sanitized = query.trim();

  // Check length limit
  if (sanitized.length === 0) {
    return { sanitized: undefined };
  }

  if (sanitized.length > SEARCH_CONFIG.MAX_QUERY_LENGTH) {
    return { 
      error: `Maximum search query length is ${SEARCH_CONFIG.MAX_QUERY_LENGTH} characters.` 
    };
  }

  // Block malicious patterns
  for (const pattern of SEARCH_CONFIG.BLOCKED_PATTERNS) {
    if (pattern.test(sanitized)) {
      // Return error for blocked patterns
      return { error: 'Invalid search query. Please avoid special characters.' };
    }
  }

  // Escape special regex characters to prevent regex injection
  sanitized = sanitized.replace(SEARCH_CONFIG.REGEX_SPECIAL_CHARS, '\\$&');

  return { sanitized };
};

/**
 * Validate and sanitize category input
 */
export const sanitizeCategory = (category: string | undefined): string | undefined => {
  if (!category || typeof category !== 'string') {
    return undefined;
  }

  const sanitized = category.trim();

  // Allow ObjectId format (24 hex characters) or category names
  if (sanitized.length === 0 || sanitized.length > 100) {
    return undefined;
  }

  // Block special characters in category names
  if (/[<>{}$]/.test(sanitized)) {
    return undefined;
  }

  return sanitized;
};

/**
 * Validate and sanitize price values
 */
export const sanitizePrice = (price: string | undefined): number | undefined => {
  if (!price) {
    return undefined;
  }

  const numPrice = Number(price);

  // Check if valid number
  if (isNaN(numPrice) || !isFinite(numPrice)) {
    return undefined;
  }

  // Check range
  if (numPrice < SEARCH_CONFIG.MIN_PRICE || numPrice > SEARCH_CONFIG.MAX_PRICE) {
    return undefined;
  }

  // Ensure non-negative and reasonable precision
  return Math.max(0, Math.round(numPrice * 100) / 100);
};

/**
 * Validate and sanitize sort parameter
 */
export const sanitizeSort = (
  sort: string | undefined
): 'createdAt_desc' | 'createdAt_asc' | 'price_desc' | 'price_asc' => {
  const validSorts = ['createdAt_desc', 'createdAt_asc', 'price_desc', 'price_asc'];
  
  if (!sort || !validSorts.includes(sort)) {
    return 'createdAt_desc'; // Default
  }

  return sort as 'createdAt_desc' | 'createdAt_asc' | 'price_desc' | 'price_asc';
};

/**
 * Validate and sanitize pagination parameters
 */
export const sanitizePagination = (
  page: string | undefined,
  pageSize: string | undefined
): { page: number; pageSize: number } => {
  let sanitizedPage = parseInt(page || '1', 10);
  let sanitizedPageSize = parseInt(pageSize || String(SEARCH_CONFIG.DEFAULT_PAGE_SIZE), 10);

  // Validate page number
  if (isNaN(sanitizedPage) || sanitizedPage < 1) {
    sanitizedPage = 1;
  }
  if (sanitizedPage > SEARCH_CONFIG.MAX_PAGE_NUMBER) {
    sanitizedPage = SEARCH_CONFIG.MAX_PAGE_NUMBER;
  }

  // Validate page size
  if (isNaN(sanitizedPageSize) || sanitizedPageSize < 1) {
    sanitizedPageSize = SEARCH_CONFIG.DEFAULT_PAGE_SIZE;
  }
  if (sanitizedPageSize > SEARCH_CONFIG.MAX_PAGE_SIZE) {
    sanitizedPageSize = SEARCH_CONFIG.MAX_PAGE_SIZE;
  }

  return { page: sanitizedPage, pageSize: sanitizedPageSize };
};

/**
 * Main validation and sanitization function
 * Returns sanitized query parameters or validation error
 */
export const validateAndSanitizeSearchQuery = (query: {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
  pageSize?: string;
}): ValidationResult => {
  try {
    // Sanitize search query
    const sanitizeResult = sanitizeSearchQuery(query.q);
    
    // If query sanitization returned an error
    if (sanitizeResult.error) {
      return {
        isValid: false,
        error: sanitizeResult.error
      };
    }
    
    const sanitizedQ = sanitizeResult.sanitized;

    // Sanitize category
    const sanitizedCategory = sanitizeCategory(query.category);
    if (query.category && !sanitizedCategory) {
      return {
        isValid: false,
        error: 'Invalid category parameter.'
      };
    }

    // Sanitize prices
    const sanitizedMinPrice = sanitizePrice(query.minPrice);
    const sanitizedMaxPrice = sanitizePrice(query.maxPrice);

    if (query.minPrice && sanitizedMinPrice === undefined) {
      return {
        isValid: false,
        error: 'Invalid minimum price. Must be a positive number between 0 and 1,000,000.'
      };
    }

    if (query.maxPrice && sanitizedMaxPrice === undefined) {
      return {
        isValid: false,
        error: 'Invalid maximum price. Must be a positive number between 0 and 1,000,000.'
      };
    }

    // Validate price range
    if (sanitizedMinPrice !== undefined && sanitizedMaxPrice !== undefined) {
      if (sanitizedMinPrice > sanitizedMaxPrice) {
        return {
          isValid: false,
          error: 'Minimum price cannot be greater than maximum price.'
        };
      }
    }

    // Sanitize sort and pagination
    const sanitizedSort = sanitizeSort(query.sort);
    const { page, pageSize } = sanitizePagination(query.page, query.pageSize);

    return {
      isValid: true,
      sanitized: {
        q: sanitizedQ,
        category: sanitizedCategory,
        minPrice: sanitizedMinPrice,
        maxPrice: sanitizedMaxPrice,
        sort: sanitizedSort,
        page,
        pageSize
      }
    };
  } catch (error: any) {
    return {
      isValid: false,
      error: 'Failed to process search query.'
    };
  }
};

export default {
  validateAndSanitizeSearchQuery,
  sanitizeSearchQuery,
  sanitizeCategory,
  sanitizePrice,
  sanitizeSort,
  sanitizePagination,
  SEARCH_CONFIG
};
