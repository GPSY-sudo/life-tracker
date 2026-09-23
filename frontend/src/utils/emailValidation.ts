/**
 * Validates email format according to RFC 5322 simplified pattern
 */
export function isValidEmail(email: string): boolean {
  // Trim whitespace
  const trimmedEmail = email.trim();
  
  // RFC 5322 simplified pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(trimmedEmail);
}
