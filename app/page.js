'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

const styles = {
  container: { background: '#0d1117', minHeight: '100vh', color: '#c9d1d9', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' },
  header: { marginBottom: '30px', borderBottom: '1px solid #30363d', paddingBottom: '20px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#58a6ff', whiteSpace: 'nowrap', flexShrink: 0 },
  stat: { textAlign: 'center' },
  statNumber: { fontSize: '32px', fontWeight: 'bold' },
  statLabel: { fontSize: '12px', color: '#8b949e' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
  card: { background: '#161b22', borderRadius: '12px', padding: '20px', border: '1px solid #30363d', cursor: 'pointer', transition: 'all 0.2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  agentName: { fontSize: '18px', fontWeight: '600', color: '#c9d1d9' },
  pulse: { width: '12px', height: '12px', borderRadius: '50%', animation: 'pulse 2s infinite' },
  status: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' },
  schedule: { color: '#8b949e', fontSize: '13px', marginBottom: '10px' },
  lastRun: { color: '#8b949e', fontSize: '12px' },
  expanded: { marginTop: '15px', padding: '15px', background: '#0d1117', borderRadius: '8px', fontSize: '13px' },
  progress: { marginTop: '20px', padding: '20px', background: '#161b22', borderRadius: '12px', border: '1px solid #30363d' },
  progressTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '15px' },
  progressBar: { height: '24px', background: '#30363d', borderRadius: '12px', overflow: 'hidden', marginBottom: '10px' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #238636, #2ea043)', borderRadius: '12px', transition: 'width 0.5s' },
  progressLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#8b949e' },
  refreshIndicator: { fontSize: '12px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '6px' }
};

const pulseKeyframes = `
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Fetch functions
const fetchAgents = async () => {
  const res = await fetch('/api/agents');
  if (!res.ok) throw new Error('Failed to fetch agents');
  return res.json();
};

const fetchProgress = async () => {
  const res = await fetch('/api/progress');
  if (!res.ok) throw new Error('Failed to fetch progress');
  return res.json();
};

export default function AgentMonitor() {
  const [expanded, setExpanded] = useState(null);
  const [expandedGoal, setExpandedGoal] = useState(null);

  // TanStack Query - auto-refetches every 30s, stale after 10s
  const { data: agentData, isLoading: agentsLoading, isFetching: agentsFetching } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const { data: progressData, isLoading: progressLoading, isFetching: progressFetching } = useQuery({
    queryKey: ['progress'],
    queryFn: fetchProgress,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const agents = agentData?.agents || [];
  const goals = {
    xFollowers: progressData?.goals?.xFollowers?.current || 35,
    xGoal: progressData?.goals?.xFollowers?.target || 100,
    ytSubs: progressData?.goals?.youtubeSubs?.current || 108,
    ytGoal: progressData?.goals?.youtubeSubs?.target || 300
  };
  const dailyGoals = progressData?.dailyGoals || {};
  const lastUpdated = progressData?.lastUpdated;
  const loading = agentsLoading || progressLoading;
  const isFetching = agentsFetching || progressFetching;

  const getStatusInfo = (agent) => {
    // Handle both old format (state.lastStatus) and new format (status/lastStatus)
    const status = agent.status || agent.state?.lastStatus || agent.lastStatus;
    const lastError = agent.lastError || agent.state?.lastError;
    
    if (status === 'error' || lastError) {
      return { color: '#f85149', text: 'ERROR', icon: '🔴' };
    }
    
    // Handle both formats for lastRun (nested state or flat)
    const lastRunMs = agent.state?.lastRunAtMs || agent.lastRunAtMs;
    const lastRunStr = agent.lastRun;
    
    if (lastRunMs && (Date.now() - lastRunMs) < 60000) {
      return { color: '#3fb950', text: 'RUNNING', icon: '🟢' };
    }
    
    // If we have a lastRun string or lastRunMs, agent has run
    if (status === 'ok' || lastRunStr || lastRunMs) {
      return { color: '#3fb950', text: 'ACTIVE', icon: '🟢' };
    }
    
    const nextRun = agent.state?.nextRunAtMs || agent.nextRunAtMs;
    if (nextRun && nextRun > Date.now()) {
      return { color: '#d29922', text: 'SCHEDULED', icon: '⏰' };
    }
    if (nextRun && nextRun < Date.now()) {
      return { color: '#f85149', text: 'OVERDUE', icon: '🔴' };
    }
    if (!lastRunStr && !lastRunMs) {
      return { color: '#d29922', text: 'SCHEDULED', icon: '⏰' };
    }
    return { color: '#8b949e', text: 'IDLE', icon: '💤' };
  };

  const formatTime = (ms, lastRunStr) => {
    // Handle string format (e.g., "10:40 AM")
    if (lastRunStr && typeof lastRunStr === 'string') return lastRunStr;
    // Handle timestamp format
    if (!ms) return 'Never';
    return new Date(ms).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatNextRun = (ms) => {
    if (!ms) return 'Not scheduled';
    const diff = ms - Date.now();
    if (diff < 0) return 'Overdue';
    if (diff < 60000) return 'Less than 1 min';
    if (diff < 3600000) return `In ${Math.round(diff/60000)} min`;
    return `In ${Math.round(diff/3600000)}h`;
  };

  const runningCount = agents.filter(a => getStatusInfo(a).text === 'RUNNING' || getStatusInfo(a).text === 'ACTIVE').length;
  const idleCount = agents.filter(a => getStatusInfo(a).text === 'IDLE' || getStatusInfo(a).text === 'SCHEDULED').length;
  const errorCount = agents.filter(a => getStatusInfo(a).text === 'ERROR' || getStatusInfo(a).text === 'OVERDUE').length;

  return (
    <div style={styles.container}>
      <style>{pulseKeyframes}</style>
      
      <header style={styles.header}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <h1 style={styles.title}>🐙 Agent Monitor</h1>
            {isFetching && (
              <div style={styles.refreshIndicator}>
                <div style={{ width: '10px', height: '10px', border: '2px solid #30363d', borderTopColor: '#58a6ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <span>Syncing...</span>
              </div>
            )}
          </div>
          <nav style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
            <a href="/generate" style={{color: 'white', textDecoration: 'none', padding: '8px 12px', background: '#238636', borderRadius: '6px', fontSize: '14px', fontWeight: '600'}}>🎬 Generate</a>
            <a href="/images" style={{color: '#58a6ff', textDecoration: 'none', padding: '8px 12px', background: '#21262d', borderRadius: '6px', fontSize: '14px'}}>🎨 Images</a>
            <a href="/todos" style={{color: '#58a6ff', textDecoration: 'none', padding: '8px 12px', background: '#21262d', borderRadius: '6px', fontSize: '14px'}}>✅ Todos</a>
            <a href="/upload" style={{color: '#58a6ff', textDecoration: 'none', padding: '8px 12px', background: '#21262d', borderRadius: '6px', fontSize: '14px'}}>📚 Upload</a>
            <a href="/rules" style={{color: '#58a6ff', textDecoration: 'none', padding: '8px 12px', background: '#21262d', borderRadius: '6px', fontSize: '14px'}}>📋 Rules</a>
            <a href="/skills" style={{color: '#58a6ff', textDecoration: 'none', padding: '8px 12px', background: '#21262d', borderRadius: '6px', fontSize: '14px'}}>⚡ Skills</a>
            <a href="/memory" style={{color: '#58a6ff', textDecoration: 'none', padding: '8px 12px', background: '#21262d', borderRadius: '6px', fontSize: '14px'}}>🧠 Memory</a>
          </nav>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '15px', padding: '12px', background: '#161b22', borderRadius: '8px'}}>
          <div style={styles.stat}>
            <div style={{...styles.statNumber, color: '#3fb950', fontSize: '24px'}}>{runningCount}</div>
            <div style={styles.statLabel}>RUNNING</div>
          </div>
          <div style={styles.stat}>
            <div style={{...styles.statNumber, color: '#8b949e', fontSize: '24px'}}>{idleCount}</div>
            <div style={styles.statLabel}>IDLE</div>
          </div>
          <div style={styles.stat}>
            <div style={{...styles.statNumber, color: '#f85149', fontSize: '24px'}}>{errorCount}</div>
            <div style={styles.statLabel}>ERRORS</div>
          </div>
        </div>
      </header>

      {/* MILESTONE CARD - Road to 1K */}
      {(() => {
        const milestone1KDeadline = new Date('2026-04-01T23:59:59');
        const now = new Date();
        const days1K = Math.max(1, Math.ceil((milestone1KDeadline - now) / (1000 * 60 * 60 * 24)));
        const needed1K = 1000 - goals.ytSubs;
        const perDay1K = Math.ceil(needed1K / days1K);
        const onTrack1K = perDay1K <= 25;
        const status1K = onTrack1K ? '🟢 ON TRACK' : perDay1K <= 30 ? '🟡 STRETCH' : '🔴 AGGRESSIVE';
        const percent1K = Math.round((goals.ytSubs / 1000) * 100);

        return (
          <div style={{...styles.progress, background: 'linear-gradient(135deg, #161b22 0%, #1a2332 100%)', border: '1px solid #238636'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
              <span style={{...styles.progressTitle, color: '#58a6ff'}}>🚀 Road to 1K</span>
              <span style={{fontSize: '14px', color: '#8b949e', fontStyle: 'italic'}}>The Big Goal</span>
            </div>
            
            <div style={{ padding: '20px', background: '#0d1117', borderRadius: '12px', border: '1px solid #30363d' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: '700', fontSize: '18px', color: '#c9d1d9' }}>YouTube Subs: {goals.ytSubs} / 1,000</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{status1K}</span>
              </div>
              <div style={{...styles.progressBar, height: '32px', background: '#21262d'}}>
                <div style={{...styles.progressFill, width: `${percent1K}%`, background: 'linear-gradient(90deg, #238636, #2ea043, #3fb950)'}}></div>
              </div>
              <div style={{...styles.progressLabel, marginTop: '12px'}}>
                <span style={{fontSize: '16px', fontWeight: '600', color: '#3fb950'}}>{percent1K}%</span>
                <span style={{color: onTrack1K ? '#3fb950' : '#d29922'}}>{needed1K} needed • {perDay1K}/day • {days1K} days left (Apr 1)</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Progress toward monthly goals */}
      {(() => {
        const xDeadline = new Date('2026-03-01T23:59:59');
        const now = new Date();
        const xDaysLeft = Math.max(1, Math.ceil((xDeadline - now) / (1000 * 60 * 60 * 24)));
        const xTarget = 100;
        const xNeeded = xTarget - goals.xFollowers;
        const xPerDay = Math.ceil(xNeeded / xDaysLeft);
        const xOnTrack = xPerDay <= 10;
        const xStatus = xOnTrack ? '🟢 ON TRACK' : xPerDay <= 15 ? '🟡 BEHIND' : '🔴 AT RISK';
        
        const ytDeadline = new Date('2026-03-01T23:59:59');
        const ytDaysLeft = Math.max(1, Math.ceil((ytDeadline - now) / (1000 * 60 * 60 * 24)));
        const ytTarget = 300;
        const ytNeeded = ytTarget - goals.ytSubs;
        const ytPerDay = Math.ceil(ytNeeded / ytDaysLeft);
        const ytOnTrack = ytPerDay <= 25;
        const ytStatus = ytOnTrack ? '🟢 ON TRACK' : ytPerDay <= 30 ? '🟡 BEHIND' : '🔴 AT RISK';

        return (
          <div style={styles.progress}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
              <span style={styles.progressTitle}>📈 March Targets</span>
              {lastUpdated && <span style={{fontSize: '12px', color: '#8b949e'}}>Updated: {new Date(lastUpdated).toLocaleTimeString()}</span>}
            </div>
            
            <div style={{ marginBottom: '25px', padding: '15px', background: '#0d1117', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: '600' }}>X Followers: {goals.xFollowers} / {xTarget}</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{xStatus}</span>
              </div>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width: `${(goals.xFollowers/xTarget)*100}%`, background: xOnTrack ? 'linear-gradient(90deg, #238636, #2ea043)' : 'linear-gradient(90deg, #d29922, #f0883e)'}}></div>
              </div>
              <div style={{...styles.progressLabel, marginTop: '8px'}}>
                <span>{Math.round((goals.xFollowers/xTarget)*100)}%</span>
                <span style={{color: xOnTrack ? '#3fb950' : '#d29922'}}>{xNeeded} needed • {xPerDay}/day • {xDaysLeft} days left (Mar 1)</span>
              </div>
            </div>
            
            <div style={{ marginBottom: '25px', padding: '15px', background: '#0d1117', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: '600' }}>YouTube Subs: {goals.ytSubs} / {ytTarget}</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{ytStatus}</span>
              </div>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width: `${(goals.ytSubs/ytTarget)*100}%`}}></div>
              </div>
              <div style={{...styles.progressLabel, marginTop: '8px'}}>
                <span>{Math.round((goals.ytSubs/ytTarget)*100)}%</span>
                <span style={{color: ytOnTrack ? '#3fb950' : '#d29922'}}>{ytNeeded} needed • {ytPerDay}/day • {ytDaysLeft} days left (Mar 1)</span>
              </div>
            </div>
            
            {/* TikTok */}
            {(() => {
              const tkFollowers = progressData?.goals?.tiktokFollowers?.current || 12;
              const tkTarget = 50;
              const tkNeeded = tkTarget - tkFollowers;
              const tkPerDay = Math.ceil(tkNeeded / xDaysLeft);
              const tkOnTrack = tkPerDay <= 6;
              const tkStatus = tkOnTrack ? '🟢 ON TRACK' : tkPerDay <= 10 ? '🟡 BEHIND' : '🔴 AT RISK';
              return (
                <div style={{ padding: '15px', background: '#0d1117', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '600' }}>TikTok Followers: {tkFollowers} / {tkTarget}</span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{tkStatus}</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{...styles.progressFill, width: `${(tkFollowers/tkTarget)*100}%`, background: tkOnTrack ? 'linear-gradient(90deg, #238636, #2ea043)' : 'linear-gradient(90deg, #d29922, #f0883e)'}}></div>
                  </div>
                  <div style={{...styles.progressLabel, marginTop: '8px'}}>
                    <span>{Math.round((tkFollowers/tkTarget)*100)}%</span>
                    <span style={{color: tkOnTrack ? '#3fb950' : '#d29922'}}>{tkNeeded} needed • {tkPerDay}/day • {xDaysLeft} days left (Mar 1)</span>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* Daily Goals - Dynatrace Style */}
      {(() => {
        const goalDefinitions = [
          { key: 'contacts', label: '👥 Influencer Contacts', target: 20, current: dailyGoals.influencerContacts?.current || dailyGoals.contacts?.current || 0, description: 'DMs, replies, or comments sent to influencers today', actions: ['Reply to parenting accounts on X', 'Comment on competitor videos', 'DM micro-influencers (1K-50K)', 'Engage with #BlackParenting posts'] },
          { key: 'responses', label: '💬 Responses Received', target: 2, current: dailyGoals.responsesReceived?.current || dailyGoals.responses?.current || 0, description: 'Replies or follow-backs from people we contacted', actions: ['Track replies to our DMs', 'Monitor follow-backs', 'Check comment replies', 'Log any collab interest'] },
          { key: 'xFollowers', label: '📈 New X Followers', target: 16, current: dailyGoals.xFollowers?.gained ?? dailyGoals.newXFollowers?.current ?? (progressData?.today?.xFollowersGained || 0), description: 'Net new followers on @RomesStorybook today', actions: ['Post native video content', 'Engage with target accounts', 'Reply to trending topics', 'Use #TrapNursery'] },
          { key: 'ytSubs', label: '🔔 New YouTube Subs', target: 17, current: dailyGoals.ytSubs?.gained ?? dailyGoals.newYTSubs?.current ?? (progressData?.today?.youtubeSubsGained || 0), description: 'Net new subscribers today (17/day for 300 by Mar 1)', actions: ['Post Shorts with strong hooks', 'Dance Party at 7 PM', 'Optimize titles per SEO guide', 'Cross-promote from X'] },
          { key: 'posts', label: '📝 Posts Published', target: 3, current: dailyGoals.postsPublished?.current || dailyGoals.posts?.current || 0, description: 'Content pieces published across all platforms', actions: ['Morning X post with native video', 'YouTube: Dance Party at 7 PM', 'Evening engagement post on X'] },
          { key: 'engagement', label: '🔥 Engagement Actions', target: 15, current: dailyGoals.engagementActions?.current || dailyGoals.engagement?.current || 0, description: 'Likes, replies, retweets done today', actions: ['Like 5 posts from target accounts', 'Reply genuinely to 5 posts', 'Retweet 3 relevant content', 'Follow 2 micro-creators'] },
        ];
        
        return (
          <div style={{...styles.progress, marginTop: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
              <span style={styles.progressTitle}>🎯 Today's Goals</span>
              <span style={{fontSize: '12px', color: '#8b949e'}}>Click any box for details</span>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px'}}>
              {goalDefinitions.map((goal) => {
                const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
                const status = percent >= 100 ? '#3fb950' : percent >= 50 ? '#d29922' : '#f85149';
                const isExpanded = expandedGoal === goal.key;
                return (
                  <div key={goal.key} onClick={() => setExpandedGoal(isExpanded ? null : goal.key)}
                    style={{padding: '15px', background: '#0d1117', borderRadius: '8px', borderLeft: `4px solid ${status}`, cursor: 'pointer', transition: 'all 0.2s', border: isExpanded ? `1px solid ${status}` : '1px solid transparent'}}>
                    <div style={{fontSize: '13px', color: '#8b949e', marginBottom: '8px', fontWeight: '500'}}>{goal.label}</div>
                    <div style={{display: 'flex', alignItems: 'baseline', gap: '4px'}}>
                      <span style={{fontSize: '28px', fontWeight: 'bold', color: status}}>{goal.current}</span>
                      <span style={{fontSize: '14px', color: '#8b949e'}}>/ {goal.target}</span>
                    </div>
                    <div style={{marginTop: '10px', height: '6px', background: '#30363d', borderRadius: '3px'}}>
                      <div style={{height: '100%', width: `${percent}%`, background: status, borderRadius: '3px', transition: 'width 0.3s'}}></div>
                    </div>
                    {isExpanded && (
                      <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #30363d'}}>
                        <div style={{fontSize: '12px', color: '#c9d1d9', marginBottom: '10px'}}>{goal.description}</div>
                        <div style={{fontSize: '11px', color: '#8b949e'}}>
                          <strong>Actions:</strong>
                          <ul style={{margin: '8px 0 0 0', paddingLeft: '18px'}}>
                            {goal.actions.map((action, i) => (<li key={i} style={{marginBottom: '4px'}}>{action}</li>))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #30363d', borderTopColor: '#58a6ff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p>Loading agents...</p>
        </div>
      ) : (
        <div style={{...styles.grid, marginTop: '20px'}}>
          {agents.map((agent) => {
            const status = getStatusInfo(agent);
            return (
              <div key={agent.id} style={{...styles.card, borderColor: status.color, borderWidth: status.text === 'ERROR' || status.text === 'OVERDUE' ? '2px' : '1px'}}
                onClick={() => setExpanded(expanded === agent.id ? null : agent.id)}>
                <div style={styles.cardHeader}>
                  <span style={styles.agentName}>{agent.name}</span>
                  <div style={{...styles.status, color: status.color}}>
                    <span>{status.text}</span>
                    <div style={{...styles.pulse, backgroundColor: status.color}}></div>
                  </div>
                </div>
                <div style={styles.schedule}>
                  ⏰ {typeof agent.schedule === 'string' ? agent.schedule :
                      agent.schedule?.kind === 'cron' ? agent.schedule.expr : 
                      agent.schedule?.kind === 'every' ? `Every ${Math.round(agent.schedule.everyMs/60000)} min` : 'Unknown'}
                </div>
                <div style={styles.lastRun}>
                  Last: {formatTime(agent.state?.lastRunAtMs || agent.lastRunAtMs, agent.lastRun)} • Next: {formatNextRun(agent.state?.nextRunAtMs || agent.nextRunAtMs)}
                </div>
                {expanded === agent.id && (
                  <div style={styles.expanded}>
                    <div><strong>ID:</strong> {agent.id?.slice(0,8)}...</div>
                    <div><strong>Duration:</strong> {agent.state?.lastDurationMs ? `${(agent.state.lastDurationMs/1000).toFixed(1)}s` : 'N/A'}</div>
                    {agent.state?.lastError && (
                      <div style={{color: '#f85149', marginTop: '10px', padding: '10px', background: '#1c1c1c', borderRadius: '6px'}}>
                        <strong>⚠️ Error:</strong> {agent.state.lastError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
