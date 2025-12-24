import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  createUser, 
  getOTP,
  getUserByUsername 
} from '@/lib/dbManager';
import {
  validateUsername,
  validateDisplayName,
  validateDOB,
  validateEmail,
  createPasswordHash,
  generateEncryptionKey,
  encryptEmail,
  hashEmailForLookup,
  generateSessionToken,
  generateSessionId,
  getSessionCookieOptions,
} from '@/lib/auth';
import { CURRENCY_CONFIG } from '@/lib/hyperParams';
import { UserDocument } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username, displayName, dob } = body;

    // Validate required fields
    if (!email || !password || !username || !displayName || !dob) {
      return NextResponse.json(
        { error: 'All fields are required: email, password, username, displayName, dob' },
        { status: 400 }
      );
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Validate username format
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { error: usernameValidation.error },
        { status: 400 }
      );
    }

    // Validate display name
    const displayNameValidation = validateDisplayName(displayName);
    if (!displayNameValidation.valid) {
      return NextResponse.json(
        { error: displayNameValidation.error },
        { status: 400 }
      );
    }

    // Validate DOB (must be 18+)
    const dobValidation = validateDOB(dob);
    if (!dobValidation.valid) {
      return NextResponse.json(
        { error: dobValidation.error },
        { status: 400 }
      );
    }

    // Check if email was verified via OTP
    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await getOTP(normalizedEmail, 'signup');
    
    // In development, skip OTP check if debug mode
    const skipOtpCheck = process.env.NODE_ENV !== 'production' && process.env.SKIP_OTP === 'true';
    
    if (!skipOtpCheck && (!otpRecord || !otpRecord.used)) {
      return NextResponse.json(
        { error: 'Email not verified. Please verify OTP first.' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    const signupTime = Date.now();

    // Generate encryption key from DOB + username + email
    const encryptionKey = generateEncryptionKey(dob, username, normalizedEmail);
    
    // Encrypt email
    const encryptedEmail = encryptEmail(normalizedEmail, encryptionKey);
    
    // Hash email for lookup
    const emailHash = hashEmailForLookup(normalizedEmail);

    // Hash password with username salt
    const passwordHash = await createPasswordHash(password, username);

    // Create user document with 4-currency system
    const newUser: UserDocument & { emailHash: string } = {
      email: encryptedEmail,
      emailHash, // For lookups
      passwordHash,
      username,
      displayName,
      dob,
      // Trial currencies
      fermentedMangos: CURRENCY_CONFIG.SIGNUP_BONUS_FERMENTED,
      expiredJuice: 0,
      // Real currencies
      mangos: 0,
      mangoJuice: 0,
      // Stats
      totalWins: 0,
      totalLosses: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      signupTime,
      lastLogin: signupTime,
      isVerified: true,
    };

    // Create user
    const result = await createUser(newUser);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create user' },
        { status: 500 }
      );
    }

    // Generate session token
    const sessionId = generateSessionId();
    const token = generateSessionToken({ 
      username, 
      displayName,
      sessionId,
    });

    // Set session cookie
    const cookieOptions = getSessionCookieOptions();
    const cookieStore = await cookies();
    cookieStore.set(cookieOptions.name, token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      maxAge: cookieOptions.maxAge,
      path: cookieOptions.path,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        username,
        displayName,
        fermentedMangos: newUser.fermentedMangos,
        expiredJuice: newUser.expiredJuice,
        mangos: newUser.mangos,
        mangoJuice: newUser.mangoJuice,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
