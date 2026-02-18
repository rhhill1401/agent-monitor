import { NextResponse } from 'next/server';
import redis from '@/lib/kv';

export const dynamic = 'force-dynamic';

const PROGRESS_KEY = 'franky:progress';

// Default progress structure
const DEFAULT_PROGRESS = {
  lastUpdated: null,
  updatedBy: null,
  goals: {
    xFollowers: { current: 35, target: 100, deadline: '2026-02-22' },
    youtubeSubs: { current: 108, target: 300, deadline: '2026-03-01' }
  },
  dailyGoals: {
    contacts: { target: 20, current: 0, label: 'Influencer Contacts' },
    responses: { target: 2, current: 0, label: 'Influencer Responses' },
    xViews: { target: 500, current: 150, label: 'X Post Views' },
    ytViews: { target: 200, current: 48, label: 'YouTube Views' },
    posts: { target: 3, current: 0, label: 'Posts Published' },
    engagement: { target: 10, current: 0, label: 'Engagement Actions' }
  },
  today: {
    xFollowersGained: 3,
    youtubeSubsGained: 8,
    postsPublished: 0,
    engagementActions: 0
  },
  topContent: []
};

export async function GET() {
  try {
    let progress = await redis.get(PROGRESS_KEY);
    if (!progress) {
      await redis.set(PROGRESS_KEY, DEFAULT_PROGRESS);
      progress = DEFAULT_PROGRESS;
    }
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Redis error:', error);
    return NextResponse.json({ ...DEFAULT_PROGRESS, error: 'Using defaults' });
  }
}

export async function POST(request) {
  try {
    const updates = await request.json();
    let progress = await redis.get(PROGRESS_KEY) || DEFAULT_PROGRESS;
    
    // Deep merge updates
    if (updates.goals) {
      progress.goals = { ...progress.goals, ...updates.goals };
      if (updates.goals.xFollowers) progress.goals.xFollowers = { ...progress.goals.xFollowers, ...updates.goals.xFollowers };
      if (updates.goals.youtubeSubs) progress.goals.youtubeSubs = { ...progress.goals.youtubeSubs, ...updates.goals.youtubeSubs };
    }
    if (updates.dailyGoals) {
      progress.dailyGoals = progress.dailyGoals || {};
      for (const [key, val] of Object.entries(updates.dailyGoals)) {
        progress.dailyGoals[key] = { ...progress.dailyGoals[key], ...val };
      }
    }
    if (updates.today) {
      progress.today = { ...progress.today, ...updates.today };
    }
    if (updates.topContent) {
      progress.topContent = updates.topContent;
    }
    
    progress.lastUpdated = new Date().toISOString();
    progress.updatedBy = updates.updatedBy || 'unknown';
    
    await redis.set(PROGRESS_KEY, progress);
    return NextResponse.json({ success: true, progress });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
