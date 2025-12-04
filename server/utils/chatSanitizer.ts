/**
 * Chat Message Sanitization Utility
 * Protects against XSS, injection attacks, and malicious content in chat messages.
 *
 * This follows the same spirit as searchSanitizer.ts: validate early, reject unsafe input,
 * and strip/normalize content before it is persisted or echoed back.
 */

interface SanitizedMessage {
  body: string;
}

interface ValidationResult {
  isValid: boolean;
  sanitized?: SanitizedMessage;
  error?: string;
}

// Configuration constants
const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 1000, // Maximum message length
  MIN_MESSAGE_LENGTH: 1, // Minimum message length (after trim)

  // Patterns to block or strip
  BLOCKED_PATTERNS: [
    /<script[^>]*>.*?<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, // Control characters (except \n, \r, \t)
    /<iframe[^>]*>/gi, // Iframes
    /<object[^>]*>/gi, // Object tags
    /<embed[^>]*>/gi, // Embed tags
    /data:text\/html/gi, // Data URLs
    /\{[\s\S]*\$[\s\S]*\}/g, // MongoDB operators inside objects
  ],

  // HTML tags to strip (convert to plain text)
  HTML_TAG_PATTERN: /<[^>]*>/g,

  // Excessive repetition patterns (spam/DoS prevention)
  EXCESSIVE_REPETITION: /(.)\1{50,}/g, // Same character repeated 50+ times
};

/**
 * Sanitize chat message body.
 * Removes XSS vectors, control characters, and excessive content.
 */
export const sanitizeChatMessage = (
  messageBody: string | undefined
): ValidationResult => {
  // Check if message exists and is string
  if (!messageBody || typeof messageBody !== "string") {
    return {
      isValid: false,
      error: "Message body is required and must be a string",
    };
  }

  // Trim whitespace
  let sanitized = messageBody.trim();

  // Check minimum length
  if (sanitized.length < CHAT_CONFIG.MIN_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: "Message cannot be empty",
    };
  }

  // Check maximum length
  if (sanitized.length > CHAT_CONFIG.MAX_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: `Message cannot exceed ${CHAT_CONFIG.MAX_MESSAGE_LENGTH} characters`,
    };
  }

  // Block malicious patterns
  for (const pattern of CHAT_CONFIG.BLOCKED_PATTERNS) {
    // Reset lastIndex for global regexes to avoid stateful behavior across calls
    if (pattern.global) pattern.lastIndex = 0;
    if (pattern.test(sanitized)) {
      return {
        isValid: false,
        error: "Message contains unsafe content and cannot be sent",
      };
    }
  }

  // Strip all HTML tags (convert to plain text)
  sanitized = sanitized.replace(CHAT_CONFIG.HTML_TAG_PATTERN, "");

  // Replace excessive character repetition (spam prevention)
  sanitized = sanitized.replace(
    CHAT_CONFIG.EXCESSIVE_REPETITION,
    (match) => match[0].repeat(10) // keep only first 10 repeats
  );

  // Normalize unicode (helps mitigate homograph attacks)
  sanitized = sanitized.normalize("NFKC");

  // Final trim after processing
  sanitized = sanitized.trim();

  if (sanitized.length === 0) {
    return {
      isValid: false,
      error: "Message cannot be empty after sanitization",
    };
  }

  return {
    isValid: true,
    sanitized: { body: sanitized },
  };
};

/**
 * Quick validation helper (returns boolean)
 */
export const isValidChatMessage = (
  messageBody: string | undefined
): boolean => {
  const result = sanitizeChatMessage(messageBody);
  return result.isValid;
};

export default {
  sanitizeChatMessage,
  isValidChatMessage,
  CHAT_CONFIG,
};

