'use client';
import { useState, useEffect } from 'react';

export default function MemoryPage() {
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      setFiles(data.files || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadFile = async (filename) => {
    setSelected(filename);
    setEditing(false);
    try {
      const res = await fetch(`/api/memory?file=${encodeURIComponent(filename)}`);
      const data = await res.json();
      setContent(data.content || '');
      setEditContent(data.content || '');
    } catch (e) {
      console.error(e);
      setContent('Error loading file');
    }
  };

  const saveFile = async () => {
    try {
      await fetch('/api/memory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: selected, content: editContent })
      });
      setContent(editContent);
      setEditing(false);
      fetchFiles();
    } catch (e) {
      alert('Error saving: ' + e.message);
    }
  };

  const styles = {
    container: { background: '#0d1117', minHeight: '100vh', color: '#c9d1d9', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
    title: { fontSize: '24px', color: '#58a6ff' },
    nav: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    navLink: { color: '#58a6ff', textDecoration: 'none', padding: '8px 14px', background: '#21262d', borderRadius: '6px', fontSize: '14px' },
    layout: { display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 'auto' },
    sidebar: { background: '#161b22', borderRadius: '12px', padding: '15px', border: '1px solid #30363d' },
    fileList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '8px' },
    fileItem: { padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', display: 'inline-block' },
    main: { background: '#161b22', borderRadius: '12px', padding: '20px', border: '1px solid #30363d' },
    content: { whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6' },
    textarea: { width: '100%', minHeight: '500px', background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '8px', padding: '15px', fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' },
    btn: { background: '#238636', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', marginRight: '10px' },
    btnSecondary: { background: '#30363d', color: '#c9d1d9', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' },
    sectionTitle: { fontSize: '12px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '10px', marginTop: '15px' }
  };

  const dailyFiles = files.filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/)).sort().reverse();
  const coreFiles = files.filter(f => !f.match(/^\d{4}-\d{2}-\d{2}\.md$/));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🧠 Memory & Training Files</h1>
        <nav style={styles.nav}>
          <a href="/" style={styles.navLink}>📊 Dashboard</a>
          <a href="/rules" style={styles.navLink}>📋 Rules</a>
          <a href="/skills" style={styles.navLink}>⚡ Skills</a>
          <a href="/knowledge" style={styles.navLink}>📚 Knowledge</a>
        </nav>
      </div>

      {loading ? (
        <p>Loading memory files...</p>
      ) : (
        <div style={styles.layout}>
          <div style={styles.sidebar}>
            <div style={styles.sectionTitle}>Core Files</div>
            <ul style={styles.fileList}>
              {coreFiles.map(f => (
                <li 
                  key={f} 
                  style={{...styles.fileItem, background: selected === f ? '#238636' : '#21262d'}}
                  onClick={() => loadFile(f)}
                >
                  {f}
                </li>
              ))}
            </ul>
            <div style={styles.sectionTitle}>Daily Memory</div>
            <ul style={styles.fileList}>
              {dailyFiles.slice(0, 10).map(f => (
                <li 
                  key={f} 
                  style={{...styles.fileItem, background: selected === f ? '#238636' : '#21262d'}}
                  onClick={() => loadFile(f)}
                >
                  {f.replace('.md', '')}
                </li>
              ))}
            </ul>
          </div>
          <div style={styles.main}>
            {selected ? (
              <>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                  <h2 style={{margin: 0, color: '#c9d1d9'}}>{selected}</h2>
                  {!editing ? (
                    <button style={styles.btn} onClick={() => setEditing(true)}>Edit</button>
                  ) : (
                    <div>
                      <button style={styles.btn} onClick={saveFile}>Save</button>
                      <button style={styles.btnSecondary} onClick={() => setEditing(false)}>Cancel</button>
                    </div>
                  )}
                </div>
                {editing ? (
                  <textarea 
                    style={styles.textarea}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                ) : (
                  <pre style={styles.content}>{content}</pre>
                )}
              </>
            ) : (
              <p style={{color: '#8b949e'}}>Select a file to view</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
