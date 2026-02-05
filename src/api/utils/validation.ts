/**
 * Validation utilities for API parameter validation.
 * Part of Issue #613 - Missing UUID validation for file ID parameter.
 *
 * @module src/api/utils/validation
 */

/**
 * Regular expression for validating UUID v4 format.
 * Matches UUIDs in the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * where x is a hexadecimal character (0-9, a-f, A-F).
 *
 * Note: This validates the format only, not that it's a specific UUID version.
 * This is intentional as we accept any valid UUID format for flexibility.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate that a string is a valid UUID.
 *
 * @param str - The string to validate
 * @returns true if the string is a valid UUID format, false otherwise
 *
 * @example
 * ```ts
 * isValidUUID('00000000-0000-0000-0000-000000000000'); // true
 * isValidUUID('ABCDEF12-3456-7890-ABCD-EF1234567890'); // true (uppercase)
 * isValidUUID('not-a-uuid'); // false
 * isValidUUID('123'); // false
 * isValidUUID(''); // false
 * ```
 */
export function isValidUUID(str: string): boolean {
  return UUID_REGEX.test(str);
}
