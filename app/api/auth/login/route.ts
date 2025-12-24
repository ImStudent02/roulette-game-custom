import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByUsername, getUserByEmail, updateUser } from '@/lib/dbManager';
import {
  verifyPassword,
  generatePasswordSalt,
  generateSessionToken,
  generateSessionId,
  getSessionCookieOptions,
} from '@/lib/auth';
import bcrypt from 'bcryptjs';

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

    // Find user by email or username
    let user;
    if (username) {
      // Username login (must start with @)
      const normalizedUsername = username.startsWith('@') ? username : `@${username}`;
      user = await getUserByUsername(normalizedUsername);
    } else {
      // Email login
      user = await getUserByEmail(email.toLowerCase().trim());
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user has password
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Account setup incomplete. Please reset your password.' },
        { status: 401 }
      );
    }

    // Verify password
    const saltHash = generatePasswordSalt(user.username);
    const combinedPassword = password + saltHash;
    const isValid = await bcrypt.compare(combinedPassword, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await updateUser(user.username, { lastLogin: Date.now() });

    // Generate session token
    const sessionId = generateSessionId();
    const token = generateSessionToken({
      username: user.username,
      displayName: user.displayName,
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
        username: user.username,
        displayName: user.displayName,
        fermentedMangos: user.fermentedMangos,
        expiredJuice: user.expiredJuice,
        mangos: user.mangos,
        mangoJuice: user.mangoJuice,
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
