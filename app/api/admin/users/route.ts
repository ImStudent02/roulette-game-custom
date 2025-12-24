import { NextResponse } from 'next/server';
import { connectToDatabase, getCollections, UserDocument } from '@/lib/db';

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  status: 'active' | 'timeout' | 'suspended' | 'banned';
  mangos: number;
  mangoJuice: number;
  fermentedMangos: number;
  lastActive: string;
}

function formatLastActive(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
  return new Date(timestamp).toLocaleDateString();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const db = await connectToDatabase();
    const { users } = getCollections(db);

    // Build query
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch users
    const userDocs = await users
      .find(query)
      .sort({ lastLogin: -1 })
      .limit(limit)
      .toArray();

    const adminUsers: AdminUser[] = userDocs.map((user: UserDocument) => ({
      id: user._id?.toString() || user.username,
      username: user.username,
      displayName: user.displayName,
      status: (user as UserDocument & { status?: string }).status as AdminUser['status'] || 'active',
      mangos: user.mangos || 0,
      mangoJuice: user.mangoJuice || 0,
      fermentedMangos: user.fermentedMangos || 0,
      lastActive: formatLastActive(user.lastLogin || Date.now()),
    }));

    return NextResponse.json({ users: adminUsers });
  } catch (error) {
    console.error('[Admin Users] GET Error:', error);
    return NextResponse.json({ users: [] });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, status } = await request.json();
    
    if (!userId || !status) {
      return NextResponse.json({ error: 'Missing userId or status' }, { status: 400 });
    }

    const validStatuses = ['active', 'timeout', 'suspended', 'banned'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const db = await connectToDatabase();
    const { users } = getCollections(db);

    const result = await users.updateOne(
      { username: userId },
      { $set: { status } }
    );

    if (result.modifiedCount === 0) {
      // Try with _id
      const { ObjectId } = require('mongodb');
      try {
        await users.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { status } }
        );
      } catch {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    console.log(`[Admin] Updated user ${userId} status to ${status}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Users] PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
