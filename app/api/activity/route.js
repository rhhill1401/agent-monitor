import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const dynamic = 'force-dynamic';

const ACTIVITY_KEY = 'rome:activity';
const MAX_ACTIVITIES = 50;

// GET recent activity feed
export async function GET() {
  try {
    const activities = await kv.lrange(ACTIVITY_KEY, 0, 19) || [];
    return NextResponse.json({ activities });
  } catch (error) {
    return NextResponse.json({ error: error.message, activities: [] }, { status: 500 });
  }
}

// POST new activity (agents call this when they complete)
export async function POST(request) {
  try {
    const { agent, action, result, timestamp } = await request.json();
    
    const activity = {
      agent,
      action,
      result,
      timestamp: timestamp || new Date().toISOString(),
      ts: Date.now()
    };

    // Push to front of list
    await kv.lpush(ACTIVITY_KEY, JSON.stringify(activity));
    // Trim to max size
    await kv.ltrim(ACTIVITY_KEY, 0, MAX_ACTIVITIES - 1);

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
