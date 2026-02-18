import { NextResponse } from 'next/server';
import redis from '@/lib/kv';

export const dynamic = 'force-dynamic';

const RULES_KEY = 'franky:rules';

// Default rules if none exist
const DEFAULT_RULES = [
  { id: '1', text: 'No emojis in X posts', category: 'posting', active: true },
  { id: '2', text: 'No em dashes - use regular dashes', category: 'posting', active: true },
  { id: '3', text: 'Check content-queue.md before ANY post', category: 'process', active: true },
  { id: '4', text: 'Never post to YouTube without Terry approval', category: 'youtube', active: true },
  { id: '5', text: 'Research before title/timing recommendations', category: 'process', active: true },
];

export async function GET() {
  try {
    let rules = await redis.get(RULES_KEY);
    if (!rules || rules.length === 0) {
      // Initialize with defaults
      await redis.set(RULES_KEY, DEFAULT_RULES);
      rules = DEFAULT_RULES;
    }
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Redis error:', error);
    return NextResponse.json({ rules: DEFAULT_RULES, error: 'Using defaults' });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    if (body.rules && Array.isArray(body.rules)) {
      await redis.set(RULES_KEY, body.rules);
      return NextResponse.json({ success: true, rules: body.rules });
    }
    
    // Add single rule
    if (body.text) {
      let rules = await redis.get(RULES_KEY) || [];
      const newRule = {
        id: Date.now().toString(),
        text: body.text,
        category: body.category || 'general',
        active: true,
        createdAt: new Date().toISOString()
      };
      rules.push(newRule);
      await redis.set(RULES_KEY, rules);
      return NextResponse.json({ success: true, rule: newRule });
    }
    
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Redis error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    
    let rules = await redis.get(RULES_KEY) || [];
    const index = rules.findIndex(r => r.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    
    rules[index] = { ...rules[index], ...updates };
    await redis.set(RULES_KEY, rules);
    return NextResponse.json({ success: true, rule: rules[index] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    
    let rules = await redis.get(RULES_KEY) || [];
    rules = rules.filter(r => r.id !== id);
    await redis.set(RULES_KEY, rules);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
