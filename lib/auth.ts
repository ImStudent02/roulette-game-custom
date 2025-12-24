import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SESSION_CONFIG } from './hyperParams';

// Secret keys - in production, use environment variables
const BASE_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'R_GAME_SECRET_KEY_2025_LIVE';
const JWT_SECRET = process.env.JWT_SECRET || 'R_GAME_JWT_SECRET_2025';

// ============================================
// Custom Encryption Key Generation
// Key = hash(DOB + username + email)
// ============================================

export function generateEncryptionKey(dob: string, username: string, email: string): string {
  const combined = `${dob}${username}${email}${BASE_ENCRYPTION_KEY}`;
  return CryptoJS.SHA256(combined).toString();
}

// ============================================
// Email Encryption (AES-256 with custom key)
// ============================================

export function encryptEmail(email: string, encryptionKey: string): string {
  return CryptoJS.AES.encrypt(email, encryptionKey).toString();
}

export function decryptEmail(encryptedEmail: string, encryptionKey: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedEmail, encryptionKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// For lookup purposes (when we don't have the key yet)
export function hashEmailForLookup(email: string): string {
  return CryptoJS.SHA256(email.toLowerCase().trim()).toString();
}

// ============================================
// Password Hashing
// Salt = username
// Final hash = hash(passHash + saltHash)
// ============================================

export function generatePasswordSalt(username: string): string {
  return CryptoJS.SHA256(username).toString();
}

export async function hashPassword(password: string, username: string): Promise<string> {
  const saltHash = generatePasswordSalt(username);
  // First hash the password with bcrypt
  const passHash = await bcrypt.hash(password, 12);
  // Then combine with salt hash and hash again
  return CryptoJS.SHA256(passHash + saltHash).toString();
}

export async function verifyPassword(
  password: string,
  username: string,
  storedHash: string
): Promise<boolean> {
  // We need a different approach since we can't reverse bcrypt
  // Store the bcrypt hash and saltHash separately
  // For now, let's use a simpler but still secure approach
  const saltHash = generatePasswordSalt(username);
  // Compare using timing-safe comparison
  try {
    // We'll store the bcrypt hash directly and verify with salt prepended
    const combinedPassword = password + saltHash;
    return await bcrypt.compare(combinedPassword, storedHash);
  } catch {
    return false;
  }
}

// Simplified version for consistent hashing
export async function createPasswordHash(password: string, username: string): Promise<string> {
  const saltHash = generatePasswordSalt(username);
  const combinedPassword = password + saltHash;
  return await bcrypt.hash(combinedPassword, 12);
}

// ============================================
// OTP Generation & Verification
// ============================================

export function generateOTP(): string {
  const length = SESSION_CONFIG.OTP_LENGTH;
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

export function getOTPExpiry(): number {
  return Date.now() + (SESSION_CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000);
}

// Mock email sender (replace with real SMTP later)
export async function sendOTPEmail(email: string, otp: string, purpose: string): Promise<boolean> {
  // TODO: Replace with real email service (SendGrid, Gmail SMTP, etc.)
  console.log('='.repeat(50));
  console.log(`📧 OTP EMAIL (MOCK)`);
  console.log(`To: ${email}`);
  console.log(`Purpose: ${purpose}`);
  console.log(`OTP: ${otp}`);
  console.log(`Expires in: ${SESSION_CONFIG.OTP_EXPIRY_MINUTES} minutes`);
  console.log('='.repeat(50));
  
  // In production, send actual email here
  return true;
}

// ============================================
// Username Validation
// No SQL-injectable characters
// ============================================

const FORBIDDEN_CHARS = /['";=\-\\/\*\+\(\)\[\]\{\}<>|&^%$#!~`]/;

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
  
  // Check for SQL-injectable characters
  if (FORBIDDEN_CHARS.test(username)) {
    return { valid: false, error: 'Username contains forbidden characters' };
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
// DOB Validation
// ============================================

export function validateDOB(dob: string): { valid: boolean; error?: string } {
  // Format: YYYY-MM-DD
  const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dobRegex.test(dob)) {
    return { valid: false, error: 'DOB must be in YYYY-MM-DD format' };
  }
  
  const date = new Date(dob);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date' };
  }
  
  // Must be at least 18 years old
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();
  
  if (age < 18 || (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))) {
    return { valid: false, error: 'Must be at least 18 years old' };
  }
  
  return { valid: true };
}

// ============================================
// Email Validation
// ============================================

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
}

// ============================================
// Session Token Management (Cookie-based)
// ============================================

export interface SessionPayload {
  username: string;
  displayName: string;
  sessionId: string;
}

export function generateSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: `${SESSION_CONFIG.COOKIE_MAX_AGE_DAYS}d` 
  });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export function generateSessionId(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}

// Cookie options for session
export function getSessionCookieOptions() {
  return {
    name: SESSION_CONFIG.COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_CONFIG.COOKIE_MAX_AGE_DAYS * 24 * 60 * 60, // in seconds
    path: '/',
  };
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

// ============================================
// Legacy exports for backward compatibility
// ============================================

export interface TokenPayload {
  username: string;
  displayName: string;
}

export function generateToken(payload: TokenPayload): string {
  const sessionPayload: SessionPayload = {
    ...payload,
    sessionId: generateSessionId(),
  };
  return generateSessionToken(sessionPayload);
}

export function verifyToken(token: string): TokenPayload | null {
  const session = verifySessionToken(token);
  if (!session) return null;
  return {
    username: session.username,
    displayName: session.displayName,
  };
}
