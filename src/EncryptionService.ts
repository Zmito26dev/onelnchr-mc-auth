import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

export class EncryptionService {
  /**
   * Derives a key from the encryption token using PBKDF2
   */
  private static deriveKey(token: string, salt: Buffer): Buffer {
    return pbkdf2Sync(token, salt as any, ITERATIONS, KEY_LENGTH, 'sha256');
  }

  /**
   * Encrypts data using AES-256-GCM
   * @param data - Plain text data to encrypt
   * @param token - Encryption token/password
   * @returns Base64 encoded string containing: salt + iv + authTag + encryptedData
   */
  static encrypt(data: string, token: string): string {
    try {
      // Generate random salt and IV
      const salt = randomBytes(SALT_LENGTH);
      const iv = randomBytes(IV_LENGTH);

      // Derive key from token
      const key = this.deriveKey(token, salt);

      // Create cipher
      const cipher = createCipheriv(ALGORITHM, key as any, iv as any);

      // Encrypt data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine: salt + iv + authTag + encrypted data
      const combined = Buffer.concat([
        salt as any,
        iv as any,
        authTag as any,
        Buffer.from(encrypted, 'hex') as any
      ]);

      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypts data encrypted with encrypt()
   * @param encryptedData - Base64 encoded encrypted data
   * @param token - Encryption token/password (must match encryption token)
   * @returns Decrypted plain text data
   */
  static decrypt(encryptedData: string, token: string): string {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract components
      const salt = combined.subarray(0, SALT_LENGTH);
      const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
      const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

      // Derive key from token
      const key = this.deriveKey(token, salt);

      // Create decipher
      const decipher = createDecipheriv(ALGORITHM, key as any, iv as any);
      decipher.setAuthTag(authTag as any);

      // Decrypt data
      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Invalid encryption token or corrupted data'}`);
    }
  }
}
