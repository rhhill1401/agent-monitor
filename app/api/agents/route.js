import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AGENTS_KEY = 'rome:agents';
const PROGRESS_KEY = 'rome:progress';
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
};
const MIRRORED_STATE_FIELDS = ['lastRunAtMs', 'nextRunAtMs', 'lastDurationMs', 'lastStatus', 'lastError'];

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

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function pickField(field, ...sources) {
  for (const source of sources) {
    if (isObject(source) && hasOwn(source, field)) {
      return source[field];
    }
  }
  return undefined;
}

function toAgentList(raw) {
  if (Array.isArray(raw)) {
    return raw.filter(isObject);
  }

  if (!isObject(raw)) {
    return [];
  }

  if (Array.isArray(raw.agents)) {
    return raw.agents.filter(isObject);
  }

  if (raw.id || raw.name) {
    return [raw];
  }

  return Object.entries(raw)
    .filter(([, value]) => isObject(value))
    .map(([key, value]) => ({ name: value.name || key, ...value }));
}

function agentKeys(agent) {
  const keys = [];

  if (agent?.id) keys.push(agent.id);
  if (agent?.name && agent.name !== agent.id) keys.push(agent.name);

  return keys;
}

function normalizeAgent(agent, base = {}) {
  const source = isObject(agent) ? agent : {};
  const sourceState = isObject(source.state) ? source.state : {};
  const baseState = isObject(base.state) ? base.state : {};

  const normalized = { ...base, ...source };
  const name = normalized.name || base.name || source.name || normalized.id || base.id || source.id;
  const id = normalized.id || base.id || source.id || name;

  if (name) normalized.name = name;
  if (id) normalized.id = id;

  const mergedState = { ...baseState, ...sourceState };

  for (const field of MIRRORED_STATE_FIELDS) {
    const value = pickField(field, source, sourceState, base, baseState);
    if (value !== undefined) {
      normalized[field] = value;
      mergedState[field] = value;
    }
  }

  if (Object.keys(mergedState).length > 0) {
    normalized.state = mergedState;
  } else {
    delete normalized.state;
  }

  return normalized;
}

function mergeAgents(baseAgents, incomingRaw) {
  const result = toAgentList(baseAgents).map((agent) => normalizeAgent(agent));
  const indexByKey = new Map();

  result.forEach((agent, idx) => {
    for (const key of agentKeys(agent)) {
      indexByKey.set(key, idx);
    }
  });

  for (const incoming of toAgentList(incomingRaw)) {
    const incomingKeys = agentKeys(incoming);
    let idx;

    for (const key of incomingKeys) {
      if (indexByKey.has(key)) {
        idx = indexByKey.get(key);
        break;
      }
    }

    if (idx === undefined) {
      const normalized = normalizeAgent(incoming);
      if (!normalized.id && !normalized.name) continue;

      idx = result.length;
      result.push(normalized);

      for (const key of agentKeys(normalized)) {
        indexByKey.set(key, idx);
      }
      continue;
    }

    const merged = normalizeAgent(incoming, result[idx]);
    result[idx] = merged;

    for (const key of agentKeys(merged)) {
      indexByKey.set(key, idx);
    }
  }

  return result;
}

function normalizeAgentsForResponse(rawAgents) {
  return mergeAgents(DEFAULT_AGENTS, rawAgents);
}

export async function GET() {
  try {
    // Always merge KV state into defaults so schedule/id metadata survives partial updates.
    const rawAgents = await kv.get(AGENTS_KEY);
    const agents = normalizeAgentsForResponse(rawAgents);

    // Get progress data for goals
    const progress = await kv.get(PROGRESS_KEY) || {};

    return NextResponse.json({ 
      agents,
      goals: {
        xFollowers: progress.goals?.xFollowers?.current || 35,
        xGoal: progress.goals?.xFollowers?.target || 100,
        ytSubs: progress.goals?.youtubeSubs?.current || 108,
        ytGoal: progress.goals?.youtubeSubs?.target || 300
      },
      lastUpdated: progress.lastUpdated
    }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Agents API error:', error);
    return NextResponse.json({ 
      error: error.message, 
      agents: DEFAULT_AGENTS,
      goals: { xFollowers: 35, xGoal: 100, ytSubs: 108, ytGoal: 300 }
    }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

// POST to update agent states (called by cron agents)
export async function POST(request) {
  try {
    const updates = await request.json();

    // Start from normalized data so defaults (schedule/id) are preserved in KV.
    let agents = normalizeAgentsForResponse(await kv.get(AGENTS_KEY));

    if (Array.isArray(updates.agents)) {
      // Treat batch payloads as upserts by default; explicit replace still rehydrates defaults.
      agents = updates.replace === true
        ? normalizeAgentsForResponse(updates.agents)
        : mergeAgents(agents, updates.agents);
    } else if (isObject(updates.agent)) {
      agents = mergeAgents(agents, [updates.agent]);
    } else if (isObject(updates) && (updates.id || updates.name)) {
      // Support direct flat agent payloads: { name, lastRunAtMs, ... }
      agents = mergeAgents(agents, [updates]);
    }

    await kv.set(AGENTS_KEY, agents);

    return NextResponse.json({ success: true, agents }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Agents POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
