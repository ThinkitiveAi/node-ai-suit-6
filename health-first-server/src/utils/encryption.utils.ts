import * as crypto from 'crypto';

export class EncryptionUtils {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key-here';

  /**
   * Encrypt sensitive data (HIPAA compliant)
   * @param data - Data to encrypt
   * @returns Encrypted data with IV and tag
   */
  static encrypt(data: string): string {
    try {
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipher(this.ALGORITHM, this.ENCRYPTION_KEY);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine IV, encrypted data, and tag
      return iv.toString('hex') + ':' + encrypted + ':' + tag.toString('hex');
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   * @param encryptedData - Encrypted data with IV and tag
   * @returns Decrypted data
   */
  static decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const tag = Buffer.from(parts[2], 'hex');
      
      const decipher = crypto.createDecipher(this.ALGORITHM, this.ENCRYPTION_KEY);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash sensitive data (one-way encryption)
   * @param data - Data to hash
   * @returns Hashed data
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate secure random token
   * @param length - Token length
   * @returns Random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt insurance policy number
   * @param policyNumber - Policy number to encrypt
   * @returns Encrypted policy number
   */
  static encryptPolicyNumber(policyNumber: string): string {
    return this.encrypt(policyNumber);
  }

  /**
   * Decrypt insurance policy number
   * @param encryptedPolicyNumber - Encrypted policy number
   * @returns Decrypted policy number
   */
  static decryptPolicyNumber(encryptedPolicyNumber: string): string {
    return this.decrypt(encryptedPolicyNumber);
  }

  /**
   * Mask sensitive data for display
   * @param data - Data to mask
   * @param maskChar - Character to use for masking
   * @param visibleChars - Number of visible characters
   * @returns Masked data
   */
  static maskData(data: string, maskChar: string = '*', visibleChars: number = 4): string {
    if (data.length <= visibleChars) {
      return data;
    }
    
    const visible = data.slice(-visibleChars);
    const masked = maskChar.repeat(data.length - visibleChars);
    return masked + visible;
  }

  /**
   * Mask phone number
   * @param phoneNumber - Phone number to mask
   * @returns Masked phone number
   */
  static maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length < 10) {
      return phoneNumber;
    }
    
    const countryCode = phoneNumber.slice(0, -10);
    const lastFour = phoneNumber.slice(-4);
    const masked = '*'.repeat(6);
    
    return countryCode + masked + lastFour;
  }

  /**
   * Mask email address
   * @param email - Email to mask
   * @returns Masked email
   */
  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    
    if (localPart.length <= 2) {
      return email;
    }
    
    const firstChar = localPart[0];
    const lastChar = localPart[localPart.length - 1];
    const masked = '*'.repeat(localPart.length - 2);
    
    return firstChar + masked + lastChar + '@' + domain;
  }

  /**
   * Validate encryption key
   * @param key - Encryption key to validate
   * @returns True if key is valid
   */
  static validateEncryptionKey(key: string): boolean {
    return key.length >= 32;
  }

  /**
   * Generate encryption key
   * @returns Secure encryption key
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
} 