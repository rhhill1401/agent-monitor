import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const dynamic = 'force-dynamic';

const AGENTS_KEY = 'rome:agents';

// Default agent list (used if KV is empty)
const DEFAULT_AGENTS = [
  { id: 'influencer-hunter-agent', name: 'influencer-hunter-agent', schedule: { kind: 'cron', expr: '0 9 * * *' }, enabled: true },
  { id: 'influencer-hunter-afternoon', name: 'influencer-hunter-afternoon', schedule: { kind: 'cron', expr: '0 14 * * *' }, enabled: true },
  { id: 'accountability-check-30min', name: 'accountability-check-30min', schedule: { kind: 'every', everyMs: 1800000 }, enabled: true },
  { id: 'progress-tracker-30min', name: 'progress-tracker-30min', schedule: { kind: 'every', everyMs: 1800000 }, enabled: true },
  { id: 'kanban-agent-30min', name: 'kanban-agent-30min', schedule: { kind: 'every', everyMs: 1800000 }, enabled: true },
  { id: 'morning-growth-work', name: 'morning-growth-work', schedule: { kind: 'cron', expr: '0 8 * * *' }, enabled: true },
  { id: 'x-agent-morning', name: 'x-agent-morning', schedule: { kind: 'cron', expr: '0 8 * * *' }, enabled: true },
  { id: 'x-agent-afternoon', name: 'x-agent-afternoon', schedule: { kind: 'cron', expr: '0 14 * * *' }, enabled: true },
  { id: 'x-agent-evening', name: 'x-agent-evening', schedule: { kind: 'cron', expr: '0 19 * * *' }, enabled: true },
  { id: 'noon-status-update', name: 'noon-status-update', schedule: { kind: 'cron', expr: '0 12 * * *' }, enabled: true },
  { id: 'evening-follower-check-6pm', name: 'evening-follower-check-6pm', schedule: { kind: 'cron', expr: '0 18 * * *' }, enabled: true },
  { id: 'organizer-agent', name: 'organizer-agent', schedule: { kind: 'every', everyMs: 14400000 }, enabled: true },
  { id: 'youtube-agent-daily', name: 'youtube-agent-daily', schedule: { kind: 'cron', expr: '0 7 * * *' }, enabled: true },
  { id: 'seo-marketing-director', name: 'seo-marketing-director', schedule: { kind: 'cron', expr: '0 7 * * *' }, enabled: true },
];

export async function GET() {
  try {
    // Try to get agents from KV
    let agents = await kv.get(AGENTS_KEY);
    
    if (!agents || !Array.isArray(agents) || agents.length === 0) {
      agents = DEFAULT_AGENTS;
    }

    // Get progress data for goals
    const progress = await kv.get('rome:progress') || {};

    return NextResponse.json({ 
      agents,
      goals: {
        xFollowers: progress.goals?.xFollowers?.current || 35,
        xGoal: progress.goals?.xFollowers?.target || 100,
        ytSubs: progress.goals?.youtubeSubs?.current || 108,
        ytGoal: progress.goals?.youtubeSubs?.target || 300
      },
      lastUpdated: progress.lastUpdated
    });
  } catch (error) {
    console.error('Agents API error:', error);
    return NextResponse.json({ 
      error: error.message, 
      agents: DEFAULT_AGENTS,
      goals: { xFollowers: 35, xGoal: 100, ytSubs: 108, ytGoal: 300 }
    }, { status: 500 });
  }
}

// POST to update agent states (called by cron agents)
export async function POST(request) {
  try {
    const updates = await request.json();
    
    // Get existing agents
    let agents = await kv.get(AGENTS_KEY) || DEFAULT_AGENTS;
    
    if (updates.agents && Array.isArray(updates.agents)) {
      // Full replacement
      agents = updates.agents;
    } else if (updates.agent) {
      // Single agent update
      const idx = agents.findIndex(a => a.id === updates.agent.id || a.name === updates.agent.name);
      if (idx >= 0) {
        agents[idx] = { ...agents[idx], ...updates.agent };
      } else {
        agents.push(updates.agent);
      }
    }

    await kv.set(AGENTS_KEY, agents);

    return NextResponse.json({ success: true, agents });
  } catch (error) {
    console.error('Agents POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
