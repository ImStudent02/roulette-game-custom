import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Secret keys - in production, use environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'R_GAME_SECRET_KEY_2025_LIVE';
const JWT_SECRET = process.env.JWT_SECRET || 'R_GAME_JWT_SECRET_2025';

// ============================================
// Email Encryption (AES-256)
// ============================================

export function encryptEmail(email: string): string {
  return CryptoJS.AES.encrypt(email, ENCRYPTION_KEY).toString();
}

export function decryptEmail(encryptedEmail: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedEmail, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// ============================================
// Password Hashing (bcrypt with custom salt)
// Salt = signupTime + username
// ============================================

export function generatePasswordSalt(signupTime: number, username: string): string {
  return `${signupTime}${username}`;
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  // Combine password with our custom salt before bcrypt
  const combinedPassword = password + salt;
  // bcrypt adds its own salt internally
  return await bcrypt.hash(combinedPassword, 12);
}

export async function verifyPassword(
  password: string,
  salt: string,
  hash: string
): Promise<boolean> {
  const combinedPassword = password + salt;
  return await bcrypt.compare(combinedPassword, hash);
}

// ============================================
// Username Validation
// ============================================

export function validateUsername(username: string): { valid: boolean; error?: string } {
  // Must start with @
  if (!username.startsWith('@')) {
    return { valid: false, error: 'Username must start with @' };
  }
  
  // Max 20 characters
  if (username.length > 20) {
    return { valid: false, error: 'Username must be max 20 characters' };
  }
  
  // Min 3 characters (@ + at least 2)
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  // Only alphanumeric and underscores after @
  const afterAt = username.slice(1);
  if (!/^[a-zA-Z0-9_]+$/.test(afterAt)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { valid: true };
}

// ============================================
// Display Name Validation
// ============================================

export function validateDisplayName(displayName: string): { valid: boolean; error?: string } {
  // Max 30 characters (counting emojis as their actual length)
  if ([...displayName].length > 30) {
    return { valid: false, error: 'Display name must be max 30 characters' };
  }
  
  // Min 1 character
  if (displayName.trim().length < 1) {
    return { valid: false, error: 'Display name is required' };
  }
  
  return { valid: true };
}

// ============================================
// JWT Token Management
// ============================================

export interface TokenPayload {
  username: string;
  displayName: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// ============================================
// Chat Message Validation
// ============================================

export function validateChatMessage(message: string): { valid: boolean; error?: string } {
  // Count words
  const words = message.trim().split(/\s+/).filter(w => w.length > 0);
  
  if (words.length > 50) {
    return { valid: false, error: 'Message must be max 50 words' };
  }
  
  if (words.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  return { valid: true };
}
