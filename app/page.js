'use client';
import { useState, useEffect } from 'react';

const styles = {
  container: { background: '#0d1117', minHeight: '100vh', color: '#c9d1d9', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #30363d', paddingBottom: '20px' },
  title: { fontSize: '28px', fontWeight: 'bold', color: '#58a6ff' },
  stats: { display: 'flex', gap: '30px' },
  stat: { textAlign: 'center' },
  statNumber: { fontSize: '32px', fontWeight: 'bold' },
  statLabel: { fontSize: '12px', color: '#8b949e' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
  card: { background: '#161b22', borderRadius: '12px', padding: '20px', border: '1px solid #30363d', cursor: 'pointer', transition: 'all 0.2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  agentName: { fontSize: '18px', fontWeight: '600', color: '#c9d1d9' },
  pulse: { width: '12px', height: '12px', borderRadius: '50%', animation: 'pulse 2s infinite' },
  status: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' },
  schedule: { color: '#8b949e', fontSize: '13px', marginBottom: '10px' },
  lastRun: { color: '#8b949e', fontSize: '12px' },
  expanded: { marginTop: '15px', padding: '15px', background: '#0d1117', borderRadius: '8px', fontSize: '13px' },
  progress: { marginTop: '20px', padding: '20px', background: '#161b22', borderRadius: '12px', border: '1px solid #30363d' },
  progressTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '15px' },
  progressBar: { height: '24px', background: '#30363d', borderRadius: '12px', overflow: 'hidden', marginBottom: '10px' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #238636, #2ea043)', borderRadius: '12px', transition: 'width 0.5s' },
  progressLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#8b949e' }
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

export default function AgentMonitor() {
  const [agents, setAgents] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState({ xFollowers: 31, xGoal: 100, ytSubs: 100, ytGoal: 200 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/agents');
        const data = await res.json();
        setAgents(data.agents || []);
        if (data.goals) setGoals(data.goals);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (agent) => {
    if (!agent.enabled) return '#f85149'; // Red - disabled
    const lastRun = agent.state?.lastRunAtMs;
    if (!lastRun) return '#8b949e'; // Gray - never run
    const minsSinceRun = (Date.now() - lastRun) / 60000;
    if (minsSinceRun < 5) return '#3fb950'; // Green - just ran
    if (minsSinceRun < 60) return '#d29922'; // Yellow - ran within hour
    return '#f85149'; // Red - stale
  };

  const getStatusText = (agent) => {
    if (!agent.enabled) return 'DISABLED';
    const lastRun = agent.state?.lastRunAtMs;
    if (!lastRun) return 'PENDING';
    const minsSinceRun = (Date.now() - lastRun) / 60000;
    if (minsSinceRun < 5) return 'ACTIVE';
    if (minsSinceRun < 60) return 'IDLE';
    return 'STALE';
  };

  const formatTime = (ms) => {
    if (!ms) return 'Never';
    const d = new Date(ms);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const activeCount = agents.filter(a => a.enabled && a.state?.lastRunAtMs && (Date.now() - a.state.lastRunAtMs) < 300000).length;
  const idleCount = agents.filter(a => a.enabled && (!a.state?.lastRunAtMs || (Date.now() - a.state.lastRunAtMs) >= 300000)).length;
  const disabledCount = agents.filter(a => !a.enabled).length;

  return (
    <div style={styles.container}>
      <style>{pulseKeyframes}</style>
      
      <header style={styles.header}>
        <h1 style={styles.title}>🐙 Agent Monitor</h1>
        <div style={styles.stats}>
          <div style={styles.stat}>
            <div style={{...styles.statNumber, color: '#3fb950'}}>{activeCount}</div>
            <div style={styles.statLabel}>ACTIVE</div>
          </div>
          <div style={styles.stat}>
            <div style={{...styles.statNumber, color: '#d29922'}}>{idleCount}</div>
            <div style={styles.statLabel}>IDLE</div>
          </div>
          <div style={styles.stat}>
            <div style={{...styles.statNumber, color: '#f85149'}}>{disabledCount}</div>
            <div style={styles.statLabel}>DISABLED</div>
          </div>
        </div>
      </header>

      {/* Progress toward goals */}
      <div style={styles.progress}>
        <div style={styles.progressTitle}>📈 Progress to Goals</div>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '5px', fontWeight: '500' }}>X Followers: {goals.xFollowers} / {goals.xGoal}</div>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${(goals.xFollowers/goals.xGoal)*100}%`}}></div>
          </div>
          <div style={styles.progressLabel}>
            <span>{Math.round((goals.xFollowers/goals.xGoal)*100)}% complete</span>
            <span>{goals.xGoal - goals.xFollowers} to go</span>
          </div>
        </div>
        <div>
          <div style={{ marginBottom: '5px', fontWeight: '500' }}>YouTube Subs: {goals.ytSubs} / {goals.ytGoal}</div>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${(goals.ytSubs/goals.ytGoal)*100}%`}}></div>
          </div>
          <div style={styles.progressLabel}>
            <span>{Math.round((goals.ytSubs/goals.ytGoal)*100)}% complete</span>
            <span>{goals.ytGoal - goals.ytSubs} to go</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #30363d', borderTopColor: '#58a6ff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p>Loading agents...</p>
        </div>
      ) : (
        <div style={{...styles.grid, marginTop: '20px'}}>
          {agents.map((agent) => (
            <div 
              key={agent.id} 
              style={{...styles.card, borderColor: expanded === agent.id ? '#58a6ff' : '#30363d'}}
              onClick={() => setExpanded(expanded === agent.id ? null : agent.id)}
            >
              <div style={styles.cardHeader}>
                <span style={styles.agentName}>{agent.name}</span>
                <div style={styles.status}>
                  <span>{getStatusText(agent)}</span>
                  <div style={{...styles.pulse, backgroundColor: getStatusColor(agent)}}></div>
                </div>
              </div>
              <div style={styles.schedule}>
                ⏰ {agent.schedule?.kind === 'cron' ? agent.schedule.expr : 
                    agent.schedule?.kind === 'every' ? `Every ${Math.round(agent.schedule.everyMs/60000)} min` : 
                    'Unknown'}
              </div>
              <div style={styles.lastRun}>
                Last run: {formatTime(agent.state?.lastRunAtMs)}
                {agent.state?.lastStatus && ` • ${agent.state.lastStatus}`}
              </div>
              {expanded === agent.id && (
                <div style={styles.expanded}>
                  <div><strong>ID:</strong> {agent.id}</div>
                  <div><strong>Next run:</strong> {formatTime(agent.state?.nextRunAtMs)}</div>
                  <div><strong>Duration:</strong> {agent.state?.lastDurationMs ? `${(agent.state.lastDurationMs/1000).toFixed(1)}s` : 'N/A'}</div>
                  {agent.state?.lastError && (
                    <div style={{color: '#f85149', marginTop: '10px'}}><strong>Error:</strong> {agent.state.lastError}</div>
                  )}
                  <div style={{marginTop: '10px', padding: '10px', background: '#161b22', borderRadius: '6px', whiteSpace: 'pre-wrap', fontSize: '12px', maxHeight: '150px', overflow: 'auto'}}>
                    <strong>Task:</strong><br/>{agent.payload?.message?.slice(0, 300)}...
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
