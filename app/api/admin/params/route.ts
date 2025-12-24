import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export interface ParamsDocument {
  _id?: string;
  key: string;
  bettingDuration: number;
  lockedDuration: number;
  spinDuration: number;
  resultDuration: number;
  maxBetReal: number;
  maxBetTrial: number;
  protectionThreshold: number;
  updatedAt: number;
  updatedBy?: string;
}

const DEFAULT_PARAMS = {
  key: 'game_params',
  bettingDuration: 210,
  lockedDuration: 30,
  spinDuration: 15,
  resultDuration: 45,
  maxBetReal: 100000,
  maxBetTrial: 1000000,
  protectionThreshold: 0.5,
};

export async function GET() {
  try {
    const db = await connectToDatabase();
    const params = db.collection<ParamsDocument>('params');

    // Get params or return defaults
    const doc = await params.findOne({ key: 'game_params' });
    
    if (doc) {
      return NextResponse.json({
        bettingDuration: doc.bettingDuration,
        lockedDuration: doc.lockedDuration,
        spinDuration: doc.spinDuration,
        resultDuration: doc.resultDuration,
        maxBetReal: doc.maxBetReal,
        maxBetTrial: doc.maxBetTrial,
        protectionThreshold: doc.protectionThreshold,
      });
    }

    return NextResponse.json(DEFAULT_PARAMS);
  } catch (error) {
    console.error('[Admin Params] GET Error:', error);
    return NextResponse.json(DEFAULT_PARAMS);
  }
}

export async function POST(request: Request) {
  try {
    const newParams = await request.json();
    
    const db = await connectToDatabase();
    const params = db.collection<ParamsDocument>('params');

    // Validate params
    const validated = {
      key: 'game_params',
      bettingDuration: Math.max(30, Math.min(600, newParams.bettingDuration || 210)),
      lockedDuration: Math.max(5, Math.min(120, newParams.lockedDuration || 30)),
      spinDuration: Math.max(5, Math.min(60, newParams.spinDuration || 15)),
      resultDuration: Math.max(10, Math.min(120, newParams.resultDuration || 45)),
      maxBetReal: Math.max(1000, Math.min(10000000, newParams.maxBetReal || 100000)),
      maxBetTrial: Math.max(10000, Math.min(100000000, newParams.maxBetTrial || 1000000)),
      protectionThreshold: Math.max(0, Math.min(1, newParams.protectionThreshold || 0.5)),
      updatedAt: Date.now(),
    };

    // Upsert params
    await params.updateOne(
      { key: 'game_params' },
      { $set: validated },
      { upsert: true }
    );

    console.log('[Admin] Updated game params:', validated);
    return NextResponse.json({ success: true, params: validated });
  } catch (error) {
    console.error('[Admin Params] POST Error:', error);
    return NextResponse.json({ error: 'Failed to save params' }, { status: 500 });
  }
}
