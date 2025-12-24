import { NextRequest, NextResponse } from 'next/server';
import { 
  validateEmail, 
  generateOTP, 
  getOTPExpiry, 
  sendOTPEmail 
} from '@/lib/auth';
import { createOTP } from '@/lib/dbManager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, purpose = 'signup' } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    // Store OTP
    await createOTP({
      email: email.toLowerCase().trim(),
      otp,
      purpose,
      createdAt: Date.now(),
      expiresAt,
      attempts: 0,
      used: false,
    });

    // Send OTP via email (mock for now)
    const sent = await sendOTPEmail(email, otp, purpose);

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send OTP email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email',
      // In production, remove this - only for testing
      ...(process.env.NODE_ENV !== 'production' && { debug_otp: otp }),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
