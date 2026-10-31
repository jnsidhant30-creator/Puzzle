/**
 * Normalizes a phone number to E.164 format.
 * Currently optimized for Indian numbers (+91), but preserves valid international formats.
 */
export const normalizePhoneNumber = (rawPhone: string): string => {
  if (!rawPhone) {
    throw new Error('Phone number is required');
  }

  // Remove all spaces, dashes, and parentheses
  let cleaned = rawPhone.replace(/[\s\-\(\)]/g, '');

  if (!cleaned) {
    throw new Error('Invalid phone number format');
  }

  // If it already starts with a '+', assume it's fully formatted E.164 and valid.
  if (cleaned.startsWith('+')) {
    // Basic check: must have + and at least 10 digits
    if (!/^\+\d{10,15}$/.test(cleaned)) {
      throw new Error('Enter a valid mobile number with country code');
    }
    return cleaned;
  }

  // For Indian numbers without country code (10 digits starting with 6-9)
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  
  // If user entered 91 followed by 10 digits (without +)
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
      return `+${cleaned}`;
  }

  // If it doesn't match above, it's invalid
  throw new Error('Enter a valid 10-digit mobile number');
};
