'use client';
import { useState, useEffect } from 'react';

export default function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [recentUsage, setRecentUsage] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkills();
    const interval = setInterval(fetchSkills, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/skills');
      const data = await res.json();
      setSkills(data.skills || []);
      setRecentUsage(data.recentUsage || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const formatTime = (iso) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.round(diff/60000)}m ago`;
    if (diff < 86400000) return `${Math.round(diff/3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const styles = {
    container: { background: '#0d1117', minHeight: '100vh', color: '#c9d1d9', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' },
    header: { marginBottom: '30px' },
    title: { fontSize: '28px', color: '#58a6ff', marginBottom: '10px' },
    subtitle: { color: '#8b949e', fontSize: '14px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px', marginBottom: '40px' },
    card: { background: '#161b22', borderRadius: '12px', padding: '20px', border: '1px solid #30363d' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
    skillName: { fontSize: '18px', fontWeight: '600', color: '#c9d1d9' },
    usageCount: { background: '#30363d', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' },
    description: { color: '#8b949e', fontSize: '14px', marginBottom: '12px', lineHeight: '1.5' },
    trigger: { color: '#58a6ff', fontSize: '13px', padding: '8px 12px', background: '#0d1117', borderRadius: '6px', marginBottom: '12px' },
    lastUsed: { fontSize: '12px', color: '#8b949e' },
    neverUsed: { color: '#f85149' },
    recentSection: { marginTop: '40px' },
    recentTitle: { fontSize: '20px', marginBottom: '15px', color: '#c9d1d9' },
    logEntry: { padding: '12px 15px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logSkill: { fontWeight: '600', color: '#58a6ff' },
    logContext: { color: '#8b949e', fontSize: '13px', marginTop: '4px' },
    logTime: { color: '#8b949e', fontSize: '12px', whiteSpace: 'nowrap' },
    backLink: { color: '#58a6ff', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' },
    noUsage: { textAlign: 'center', padding: '40px', color: '#8b949e' }
  };

  if (loading) {
    return <div style={styles.container}><p>Loading skills...</p></div>;
  }

  return (
    <div style={styles.container}>
      <a href="/" style={styles.backLink}>← Back to Dashboard</a>
      
      <div style={styles.header}>
        <h1 style={styles.title}>🧠 Skills Monitor</h1>
        <p style={styles.subtitle}>Track which skills Franky is using and when</p>
      </div>

      <div style={styles.grid}>
        {skills.map(skill => (
          <div key={skill.id} style={{
            ...styles.card,
            borderColor: (skill.useCount || skill.usageCount) > 0 ? '#238636' : '#30363d',
            borderWidth: (skill.useCount || skill.usageCount) > 0 ? '2px' : '1px'
          }}>
            <div style={styles.cardHeader}>
              <span style={styles.skillName}>{skill.name}</span>
              <span style={styles.usageCount}>
                {(skill.useCount || skill.usageCount) > 0 ? `Used ${skill.useCount || skill.usageCount}x` : 'Never used'}
              </span>
            </div>
            {skill.description && <p style={styles.description}>{skill.description}</p>}
            <div style={styles.trigger}>
              <strong>Trigger:</strong> {skill.trigger || 'Not defined'}
            </div>
            <div style={{
              ...styles.lastUsed,
              ...((!skill.useCount && !skill.usageCount) ? styles.neverUsed : {})
            }}>
              {skill.lastUsed ? (
                <>Last used: {formatTime(skill.lastUsed)}</>
              ) : (
                '⚠️ Never used — should be triggered by above conditions'
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.recentSection}>
        <h2 style={styles.recentTitle}>📜 Recent Skill Usage</h2>
        <div style={{...styles.card, padding: 0}}>
          {recentUsage.length === 0 ? (
            <div style={styles.noUsage}>
              No skill usage logged yet. Skills will appear here when Franky uses them.
            </div>
          ) : (
            recentUsage.map((entry, i) => (
              <div key={i} style={styles.logEntry}>
                <div>
                  <div style={styles.logSkill}>{entry.skillId}</div>
                  <div style={styles.logContext}>{entry.context}</div>
                </div>
                <div style={styles.logTime}>{formatTime(entry.timestamp)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
