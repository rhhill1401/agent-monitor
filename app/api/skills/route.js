import { NextResponse } from 'next/server';
import redis from '@/lib/kv';

export const dynamic = 'force-dynamic';

const SKILLS_KEY = 'franky:skills';

// Default skills list
const DEFAULT_SKILLS = [
  { id: 'first-principles-thinking', name: 'First Principles Thinking', lastUsed: null, useCount: 0 },
  { id: 'x-native-video-poster', name: 'X Native Video Poster', lastUsed: null, useCount: 0 },
  { id: 'collab-outreach', name: 'Collab Outreach', lastUsed: null, useCount: 0 },
  { id: 'youtube-shorts-optimizer', name: 'YouTube Shorts Optimizer', lastUsed: null, useCount: 0 },
  { id: 'ad-spend-analyzer', name: 'Ad Spend Analyzer', lastUsed: null, useCount: 0 },
];

export async function GET() {
  try {
    let skills = await redis.get(SKILLS_KEY);
    if (!skills || skills.length === 0) {
      await redis.set(SKILLS_KEY, DEFAULT_SKILLS);
      skills = DEFAULT_SKILLS;
    }
    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Redis error:', error);
    return NextResponse.json({ skills: DEFAULT_SKILLS, error: 'Using defaults' });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { skillId, action } = body;
    
    // Bulk update skills
    if (body.skills && Array.isArray(body.skills)) {
      await redis.set(SKILLS_KEY, body.skills);
      return NextResponse.json({ success: true, skills: body.skills });
    }
    
    if (action === 'log' && skillId) {
      let skills = await redis.get(SKILLS_KEY) || DEFAULT_SKILLS;
      const index = skills.findIndex(s => s.id === skillId);
      
      if (index !== -1) {
        skills[index].lastUsed = new Date().toISOString();
        skills[index].useCount = (skills[index].useCount || 0) + 1;
      } else {
        // Add new skill
        skills.push({
          id: skillId,
          name: skillId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          lastUsed: new Date().toISOString(),
          useCount: 1
        });
      }
      
      await redis.set(SKILLS_KEY, skills);
      return NextResponse.json({ success: true, skill: skills.find(s => s.id === skillId) });
    }
    
    return NextResponse.json({ error: 'Invalid request. Use {skillId, action: "log"}' }, { status: 400 });
  } catch (error) {
    console.error('Redis error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
