'use client';
import { useState, useEffect } from 'react';

export default function KnowledgePage() {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const res = await fetch('/api/knowledge');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadFile = async (path) => {
    setSelected(path);
    try {
      const res = await fetch(`/api/knowledge?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      setContent(data.content || '');
    } catch (e) {
      console.error(e);
      setContent('Error loading file');
    }
  };

  const styles = {
    container: { background: '#0d1117', minHeight: '100vh', color: '#c9d1d9', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
    title: { fontSize: '24px', color: '#58a6ff' },
    nav: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    navLink: { color: '#58a6ff', textDecoration: 'none', padding: '8px 14px', background: '#21262d', borderRadius: '6px', fontSize: '14px' },
    layout: { display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '70vh' },
    sidebar: { background: '#161b22', borderRadius: '12px', padding: '15px', border: '1px solid #30363d' },
    main: { background: '#161b22', borderRadius: '12px', padding: '20px', border: '1px solid #30363d' },
    content: { whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6' },
    category: { marginBottom: '20px' },
    categoryTitle: { fontSize: '14px', color: '#58a6ff', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' },
    fileList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '6px' },
    fileItem: { padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'inline-block' }
  };

  const icons = {
    'Content Library': '📼',
    'Analytics': '📊',
    'Research': '🔬',
    'Outreach': '📧',
    'Growth Tracking': '📈',
    'Skills': '⚡',
    'Competitor Analysis': '🎯'
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📚 Project Knowledge Base</h1>
        <nav style={styles.nav}>
          <a href="/" style={styles.navLink}>📊 Dashboard</a>
          <a href="/memory" style={styles.navLink}>🧠 Memory</a>
          <a href="/rules" style={styles.navLink}>📋 Rules</a>
          <a href="/skills" style={styles.navLink}>⚡ Skills</a>
        </nav>
      </div>

      {loading ? (
        <p>Loading knowledge base...</p>
      ) : (
        <div style={styles.layout}>
          <div style={styles.sidebar}>
            {categories.map(cat => (
              <div key={cat.name} style={styles.category}>
                <div style={styles.categoryTitle}>
                  {icons[cat.name] || '📁'} {cat.name}
                </div>
                <ul style={styles.fileList}>
                  {cat.files.map(f => (
                    <li 
                      key={f.path} 
                      style={{...styles.fileItem, background: selected === f.path ? '#238636' : '#21262d'}}
                      onClick={() => loadFile(f.path)}
                    >
                      {f.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={styles.main}>
            {selected ? (
              <>
                <h2 style={{margin: '0 0 15px 0', color: '#c9d1d9', fontSize: '16px'}}>{selected.split('/').pop()}</h2>
                <pre style={styles.content}>{content}</pre>
              </>
            ) : (
              <div style={{color: '#8b949e'}}>
                <p>Select a file to view its contents.</p>
                <p style={{marginTop: '20px'}}>This knowledge base includes:</p>
                <ul>
                  <li>Content library - available videos and media</li>
                  <li>Analytics - performance data</li>
                  <li>Research - competitor analysis, trends</li>
                  <li>Outreach - DM templates, contact logs</li>
                  <li>Skills - custom skills for Rome's Storybook</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
