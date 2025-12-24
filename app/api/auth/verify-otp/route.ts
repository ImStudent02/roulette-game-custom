import { NextRequest, NextResponse } from 'next/server';
import { getOTP, markOTPUsed, incrementOTPAttempts } from '@/lib/dbManager';

const MAX_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, purpose = 'signup' } = body;

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get stored OTP
    const storedOTP = await getOTP(normalizedEmail, purpose);

    if (!storedOTP) {
      return NextResponse.json(
        { error: 'OTP expired or not found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check attempts
    if (storedOTP.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }

    // Verify OTP
    if (storedOTP.otp !== otp) {
      await incrementOTPAttempts(normalizedEmail, purpose);
      const remainingAttempts = MAX_ATTEMPTS - storedOTP.attempts - 1;
      
      return NextResponse.json(
        { 
          error: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
          remainingAttempts 
        },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await markOTPUsed(normalizedEmail, purpose);

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      verified: true,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
