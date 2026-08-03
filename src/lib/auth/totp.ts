import { randomBytes } from "node:crypto";
import { generateSecret, generateURI, verifySync } from "otplib";

/**
 * Generate a new TOTP secret for an admin user.
 *
 * @returns TOTP secret and provisioning URI
 */
export function generateTOTPSecret(): { readonly secret: string; readonly uri: string } {
  const secret = generateSecret();
  const uri = generateURI({
    issuer: "Lendas do DC",
    label: "admin@lendasdc.local",
    secret,
  });

  return { secret, uri };
}

/**
 * Verify a TOTP code.
 *
 * @param secret - User's TOTP secret
 * @param code - TOTP code to verify
 * @returns Whether code is valid
 */
export function verifyTOTP(secret: string, code: string): boolean {
  try {
    return verifySync({ secret, token: code }).valid;
  } catch {
    return false;
  }
}

/**
 * Generate backup codes for account recovery.
 *
 * @param count - Number of backup codes to generate
 * @returns Array of backup codes
 */
export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  for (let index = 0; index < count; index += 1) {
    const bytes = randomBytes(8);
    const code = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
    codes.push(code);
  }

  return codes;
}
