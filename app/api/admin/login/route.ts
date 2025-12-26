import { NextResponse } from 'next/server';

// Simple admin credentials (in production, use proper auth)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'mango2024', // Change this in production!
};

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      // Generate simple token (in production, use JWT)
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      
      const response = NextResponse.json({ 
        success: true, 
        token,
        message: 'Login successful'
      });
      
      // Set admin session cookie (expires when browser closes)
      response.cookies.set('adminSession', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      
      return response;
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

