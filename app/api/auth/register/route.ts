import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollections, UserDocument } from '@/lib/db';
import {
  encryptEmail,
  hashPassword,
  generatePasswordSalt,
  validateUsername,
  validateDisplayName,
  generateToken,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username, displayName } = body;

    // Validate required fields
    if (!email || !username || !displayName) {
      return NextResponse.json(
        { error: 'Email, username, and display name are required' },
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

    // Connect to database
    const db = await connectToDatabase();
    const { users } = getCollections(db);

    // Check if username already exists
    const existingUsername = await users.findOne({ username });
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Encrypt email for storage
    const encryptedEmail = encryptEmail(email);

    // Check if email already exists
    const existingEmail = await users.findOne({ email: encryptedEmail });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    const signupTime = Date.now();

    // Create user document
    const newUser: UserDocument = {
      email: encryptedEmail,
      username,
      displayName,
      balance: 1000, // Starting balance
      totalWins: 0,
      totalLosses: 0,
      signupTime,
      lastLogin: signupTime,
    };

    // Hash password if provided (optional for Google login)
    if (password) {
      const salt = generatePasswordSalt(signupTime, username);
      newUser.passwordHash = await hashPassword(password, salt);
    }

    // Insert user
    await users.insertOne(newUser);

    // Generate JWT token
    const token = generateToken({ username, displayName });

    return NextResponse.json({
      success: true,
      token,
      user: {
        username,
        displayName,
        balance: newUser.balance,
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
