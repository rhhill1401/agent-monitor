'use client';
import { useState } from 'react';

const styles = {
  container: { background: '#0d1117', minHeight: '100vh', color: '#c9d1d9', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' },
  header: { marginBottom: '30px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#58a6ff', marginBottom: '10px' },
  subtitle: { color: '#8b949e', fontSize: '14px' },
  backLink: { color: '#58a6ff', textDecoration: 'none', fontSize: '14px', display: 'inline-block', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' },
  label: { fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' },
  textarea: { width: '100%', minHeight: '200px', padding: '15px', background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', color: '#c9d1d9', fontSize: '14px', resize: 'vertical' },
  select: { padding: '12px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#c9d1d9', fontSize: '14px', width: '100%' },
  row: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  col: { flex: 1, minWidth: '200px' },
  button: { padding: '15px 30px', background: '#238636', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '16px' },
  buttonDisabled: { background: '#30363d', cursor: 'not-allowed' },
  output: { marginTop: '30px', padding: '20px', background: '#161b22', borderRadius: '12px', border: '1px solid #30363d' },
  outputSection: { marginBottom: '25px' },
  outputLabel: { fontSize: '12px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '8px' },
  outputContent: { padding: '15px', background: '#0d1117', borderRadius: '8px', fontSize: '14px', whiteSpace: 'pre-wrap' },
  copyBtn: { padding: '6px 12px', background: '#21262d', border: '1px solid #30363d', borderRadius: '4px', color: '#c9d1d9', cursor: 'pointer', fontSize: '12px', marginTop: '8px' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  tag: { padding: '6px 12px', background: '#238636', borderRadius: '20px', fontSize: '12px' },
  timing: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  timeSlot: { padding: '12px 20px', background: '#21262d', borderRadius: '8px', textAlign: 'center' },
  timeDay: { fontWeight: '600', marginBottom: '4px' },
  timeHour: { color: '#8b949e', fontSize: '13px' }
};

export default function GeneratePage() {
  const [script, setScript] = useState('');
  const [contentType, setContentType] = useState('song');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    if (!script.trim()) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/generate-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, contentType, duration })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      setResult({ error: 'Failed to generate. Try again.' });
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={styles.container}>
      <a href="/" style={styles.backLink}>← Back to Dashboard</a>
      
      <header style={styles.header}>
        <h1 style={styles.title}>🎬 Content Generator</h1>
        <p style={styles.subtitle}>Paste your script → Get SEO-optimized title, description, tags, and post times</p>
      </header>

      <div style={styles.form}>
        <div>
          <label style={styles.label}>Content Type</label>
          <div style={styles.row}>
            <div style={styles.col}>
              <select value={contentType} onChange={(e) => setContentType(e.target.value)} style={styles.select}>
                <option value="song">🎵 Song / Music Video</option>
                <option value="story">📖 Bedtime Story</option>
                <option value="compilation">📀 Compilation</option>
                <option value="short">📱 Short (under 60s)</option>
              </select>
            </div>
            <div style={styles.col}>
              <input 
                type="text" 
                placeholder="Duration (e.g., 3:08 or 30 min)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{...styles.select}}
              />
            </div>
          </div>
        </div>

        <div>
          <label style={styles.label}>Script / Lyrics / Story Summary</label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your song lyrics, story script, or content summary here...

Example:
Song: I Am a King
Theme: Self-affirmation, Black excellence, confidence
Lyrics: 'I wake up every morning knowing I'm a king / Crown on my head, yeah I do my thing...'"
            style={styles.textarea}
          />
        </div>

        <button 
          onClick={generate} 
          disabled={loading || !script.trim()}
          style={{...styles.button, ...(loading || !script.trim() ? styles.buttonDisabled : {})}}
        >
          {loading ? '⏳ Generating...' : '✨ Generate Metadata'}
        </button>
      </div>

      {result && !result.error && (
        <div style={styles.output}>
          <div style={styles.outputSection}>
            <div style={styles.outputLabel}>📌 Title (under 50 chars)</div>
            <div style={styles.outputContent}>{result.title}</div>
            <button onClick={() => copyToClipboard(result.title)} style={styles.copyBtn}>Copy</button>
          </div>

          {result.shortTitle && (
            <div style={styles.outputSection}>
              <div style={styles.outputLabel}>📱 Short Title (with emojis)</div>
              <div style={styles.outputContent}>{result.shortTitle}</div>
              <button onClick={() => copyToClipboard(result.shortTitle)} style={styles.copyBtn}>Copy</button>
            </div>
          )}

          <div style={styles.outputSection}>
            <div style={styles.outputLabel}>📝 Description (250+ words)</div>
            <div style={{...styles.outputContent, maxHeight: '300px', overflow: 'auto'}}>{result.description}</div>
            <button onClick={() => copyToClipboard(result.description)} style={styles.copyBtn}>Copy</button>
          </div>

          <div style={styles.outputSection}>
            <div style={styles.outputLabel}>🏷️ Tags (15-20)</div>
            <div style={styles.tags}>
              {result.tags?.map((tag, i) => (
                <span key={i} style={styles.tag}>{tag}</span>
              ))}
            </div>
            <button onClick={() => copyToClipboard(result.tags?.join(', '))} style={styles.copyBtn}>Copy All Tags</button>
          </div>

          <div style={styles.outputSection}>
            <div style={styles.outputLabel}>⏰ Optimal Post Times</div>
            <div style={styles.timing}>
              {result.postTimes?.map((time, i) => (
                <div key={i} style={styles.timeSlot}>
                  <div style={styles.timeDay}>{time.day}</div>
                  <div style={styles.timeHour}>{time.time} CST</div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.outputSection}>
            <div style={styles.outputLabel}>✅ Pre-Upload Checklist</div>
            <div style={styles.outputContent}>
{`☐ Title under 50 characters
☐ Primary keyword in first 5 words
☐ Description 250+ words
☐ Primary keyword in first 25 words of description
☐ 8-12 hashtags at end of description
☐ 15-20 tags added
☐ Verbal CTA in video ("Subscribe to Rome's Storybook!")
☐ Thumbnail uploaded
☐ Made for Kids = Yes
☐ Correct playlist selected`}
            </div>
          </div>
        </div>
      )}

      {result?.error && (
        <div style={{...styles.output, borderColor: '#f85149'}}>
          <p style={{color: '#f85149'}}>{result.error}</p>
        </div>
      )}
    </div>
  );
}
