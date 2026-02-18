import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let agents = [];
    
    // Mock data based on actual cron jobs we know exist
    agents = [
      {
        id: 'd198b194-9d7b-4d00-a594-e014070f1674',
        name: 'outreach-agent-daily',
        enabled: true,
        schedule: { kind: 'cron', expr: '0 10 * * *' },
        payload: { message: 'Find micro-influencers, get responses, log outreach' },
        state: { lastRunAtMs: Date.now() - 3600000, lastStatus: 'ok', nextRunAtMs: Date.now() + 50400000 }
      },
      {
        id: 'bf9ad825-31c2-4f94-a81e-3ab0f63e56d8',
        name: 'content-poster-7pm',
        enabled: true,
        schedule: { kind: 'cron', expr: '0 19 * * *' },
        payload: { message: 'Post native video to X, verify live, log to tracker' },
        state: { lastRunAtMs: Date.now() - 600000, lastStatus: 'ok', lastDurationMs: 177000, nextRunAtMs: Date.now() + 82800000 }
      },
      {
        id: '145ca80a-bc3f-4267-aea4-9fa7dec8efdb',
        name: 'supercharged-prick',
        enabled: true,
        schedule: { kind: 'cron', expr: '0 21 * * *' },
        payload: { message: 'Close the day with results, check follower count, send Terry summary' },
        state: { lastRunAtMs: null, lastStatus: null, nextRunAtMs: Date.now() + 5400000 }
      },
      {
        id: 'ad0874cc-6cce-4780-a58a-603287582194',
        name: 'youtube-short-7pm',
        enabled: true,
        schedule: { kind: 'cron', expr: '0 19 * * *' },
        payload: { message: 'Post YouTube Short with When... title formula' },
        state: { lastRunAtMs: Date.now() - 600000, lastStatus: 'ok', lastDurationMs: 277000, nextRunAtMs: Date.now() + 82800000 }
      },
      {
        id: 'ba390b0f-2d16-474c-b88b-4195eaffb523',
        name: 'x-agent-evening',
        enabled: true,
        schedule: { kind: 'cron', expr: '0 19 * * *' },
        payload: { message: 'Prime time X engagement, post native video, final push' },
        state: { lastRunAtMs: Date.now() - 900000, lastStatus: 'ok', lastDurationMs: 300000, nextRunAtMs: Date.now() + 82800000 }
      },
      {
        id: '58c88911-493d-41a9-b097-b3741450a254',
        name: 'engagement-every-2hrs',
        enabled: true,
        schedule: { kind: 'every', everyMs: 7200000 },
        payload: { message: 'Engagement blitz: search hashtags, like and reply to 3-5 posts' },
        state: { lastRunAtMs: Date.now() - 1800000, lastStatus: 'ok', lastDurationMs: 99000, nextRunAtMs: Date.now() + 5400000 }
      },
      {
        id: '569a5e5a-9abd-4fff-a142-afc3a3210381',
        name: 'prick-hourly-review',
        enabled: false,
        schedule: { kind: 'every', everyMs: 3600000 },
        payload: { message: 'FIRED - Was auditing instead of executing' },
        state: { lastRunAtMs: Date.now() - 7200000, lastStatus: 'ok' }
      },
      {
        id: '9b395b6d-9902-418d-a88a-eeff1508a0e7',
        name: 'overseer-agent',
        enabled: false,
        schedule: { kind: 'cron', expr: '0 21 * * *' },
        payload: { message: 'FIRED - Was reporting problems instead of solving them' },
        state: { lastRunAtMs: Date.now() - 86400000, lastStatus: 'ok' }
      },
      {
        id: '00752a97-3421-42fd-a1e1-df199dc187f3',
        name: 'youtube-agent-daily',
        enabled: true,
        schedule: { kind: 'cron', expr: '0 7 * * *' },
        payload: { message: 'Check YouTube analytics, plan Shorts, track subs' },
        state: { lastRunAtMs: Date.now() - 43200000, lastStatus: 'ok', nextRunAtMs: Date.now() + 39600000 }
      },
      {
        id: '116ed057-64da-4ec8-a903-2af2af4470a4',
        name: 'x-agent-morning',
        enabled: true,
        schedule: { kind: 'cron', expr: '0 8 * * *' },
        payload: { message: 'Morning X post, 5 engagement replies, check notifications' },
        state: { lastRunAtMs: Date.now() - 39600000, lastStatus: 'error', lastError: 'timeout', nextRunAtMs: Date.now() + 43200000 }
      }
    ];

    // Current goals
    const goals = {
      xFollowers: 31,
      xGoal: 100,
      ytSubs: 100,
      ytGoal: 200
    };

    return NextResponse.json({ agents, goals });
  } catch (error) {
    return NextResponse.json({ error: error.message, agents: [] }, { status: 500 });
  }
}
