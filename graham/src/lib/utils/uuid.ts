/**
 * UUID Generation Utilities
 * Provides standardized UUID generation for the application
 */

/**
 * Generates a v4 UUID using the Web Crypto API (browser) or crypto module (Node.js)
 * Fallback to a high-quality random UUID if crypto.randomUUID is not available
 */
export function generateUUID(): string {
  // Try using native crypto.randomUUID first (most secure)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback to manual v4 UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Validates if a string is a valid UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Generates a user ID with proper UUID format
 * Replaces hardcoded "user-123" patterns
 */
export function generateUserID(): string {
  return generateUUID()
}

/**
 * Generates a session ID with proper UUID format
 * Replaces timestamp-based session IDs
 */
export function generateSessionID(): string {
  return generateUUID()
}

/**
 * Generates an interaction ID for feedback interactions
 * Replaces "mock-{timestamp}" patterns
 */
export function generateInteractionID(): string {
  return generateUUID()
}

/**
 * Generates a pattern ID for discovered patterns
 */
export function generatePatternID(): string {
  return generateUUID()
}

/**
 * Converts a non-UUID string to a valid UUID
 * This is a temporary function to help migrate from non-UUID IDs
 * @param input - The input string to convert
 * @param prefix - Optional prefix to identify the source (for debugging)
 */
export function convertToUUID(input: string, prefix?: string): string {
  // If it's already a valid UUID, return as-is
  if (isValidUUID(input)) {
    return input
  }
  
  // Generate a new UUID for non-UUID inputs
  const uuid = generateUUID()
  
  // Log the conversion for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[UUID Migration] Converting "${input}" to "${uuid}"${prefix ? ` (${prefix})` : ''}`)
  }
  
  return uuid
}

/**
 * Creates a deterministic UUID from a string
 * Useful for creating consistent UUIDs from the same input
 * Note: This is not cryptographically secure, use only for non-sensitive data
 */
export function createDeterministicUUID(input: string): string {
  // Simple hash function
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Convert to positive number and pad
  const positiveHash = Math.abs(hash).toString(16).padStart(8, '0')
  
  // Create UUID v4 format with the hash
  const uuid = `${positiveHash.substring(0, 8)}-${positiveHash.substring(0, 4)}-4${positiveHash.substring(1, 4)}-8${positiveHash.substring(0, 3)}-${positiveHash}${positiveHash}`
  
  return uuid.substring(0, 36)
}

/**
 * Demo user ID generator that creates a consistent UUID for demo purposes
 * This ensures that demo data is consistent across sessions while still using valid UUIDs
 */
export function generateDemoUserID(): string {
  // Create a consistent UUID for demo user
  return createDeterministicUUID('demo-user-123')
}