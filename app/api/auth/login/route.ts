import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollections } from '@/lib/db';
import {
  encryptEmail,
  verifyPassword,
  generatePasswordSalt,
  generateToken,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username } = body;

    // Must provide either email+password or username+password
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (!email && !username) {
      return NextResponse.json(
        { error: 'Email or username is required' },
        { status: 400 }
      );
    }

    // Connect to database
    const db = await connectToDatabase();
    const { users } = getCollections(db);

    // Find user by email or username
    let user;
    if (email) {
      const encryptedEmail = encryptEmail(email);
      user = await users.findOne({ email: encryptedEmail });
    } else {
      user = await users.findOne({ username });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user has password (might be Google login only)
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Please use Google login for this account' },
        { status: 401 }
      );
    }

    // Verify password
    const salt = generatePasswordSalt(user.signupTime, user.username);
    const isValid = await verifyPassword(password, salt, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await users.updateOne(
      { _id: user._id },
      { $set: { lastLogin: Date.now() } }
    );

    // Generate JWT token
    const token = generateToken({
      username: user.username,
      displayName: user.displayName,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        username: user.username,
        displayName: user.displayName,
        balance: user.balance,
        totalWins: user.totalWins,
        totalLosses: user.totalLosses,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
