'use client';
import { useState, useEffect } from 'react';

const styles = {
  container: { background: '#0d1117', minHeight: '100vh', color: '#c9d1d9', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' },
  header: { marginBottom: '30px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#58a6ff', marginBottom: '10px' },
  subtitle: { color: '#8b949e', fontSize: '14px' },
  backLink: { color: '#58a6ff', textDecoration: 'none', fontSize: '14px', display: 'inline-block', marginBottom: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
  card: { background: '#161b22', borderRadius: '12px', padding: '20px', border: '1px solid #30363d' },
  cardTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' },
  cardDesc: { color: '#8b949e', fontSize: '14px', marginBottom: '15px' },
  textarea: { width: '100%', minHeight: '150px', padding: '12px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', color: '#c9d1d9', fontSize: '13px', resize: 'vertical', marginBottom: '10px' },
  button: { padding: '10px 20px', background: '#238636', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  buttonSecondary: { padding: '10px 20px', background: '#21262d', border: '1px solid #30363d', borderRadius: '6px', color: '#c9d1d9', cursor: 'pointer', fontSize: '14px', marginLeft: '10px' },
  success: { color: '#3fb950', fontSize: '13px', marginTop: '10px' },
  error: { color: '#f85149', fontSize: '13px', marginTop: '10px' },
  fileList: { marginTop: '30px' },
  fileItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: '#161b22', borderRadius: '8px', marginBottom: '10px', border: '1px solid #30363d' },
  fileName: { fontWeight: '500' },
  fileDate: { color: '#8b949e', fontSize: '12px' },
  viewBtn: { padding: '6px 12px', background: '#21262d', border: '1px solid #30363d', borderRadius: '4px', color: '#c9d1d9', cursor: 'pointer', fontSize: '12px' }
};

const INSTRUCTION_FILES = [
  { id: 'seo', name: 'AGENT-SEO-INSTRUCTIONS.md', icon: '🔍', desc: 'Title, description, and tag rules' },
  { id: 'rules', name: 'FRANKY-RULES.md', icon: '📋', desc: 'Posting rules and constraints' },
  { id: 'soul', name: 'SOUL.md', icon: '🧠', desc: 'Agent identity and mission' },
  { id: 'heartbeat', name: 'HEARTBEAT.md', icon: '💓', desc: 'Daily checklist and status' },
];

export default function UploadPage() {
  const [files, setFiles] = useState({});
  const [editing, setEditing] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [status, setStatus] = useState({});
  const [customDocs, setCustomDocs] = useState([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocContent, setNewDocContent] = useState('');

  useEffect(() => {
    // Load current file contents
    INSTRUCTION_FILES.forEach(file => {
      fetch(`/api/memory?file=${file.name}`)
        .then(res => res.json())
        .then(data => {
          setFiles(prev => ({ ...prev, [file.id]: data.content || '' }));
        });
    });
    
    // Load custom docs list
    fetch('/api/knowledge')
      .then(res => res.json())
      .then(data => setCustomDocs(data.docs || []));
  }, []);

  const startEdit = (fileId, content) => {
    setEditing(fileId);
    setEditContent(content);
    setStatus({});
  };

  const saveFile = async (fileId, fileName) => {
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: fileName, content: editContent })
      });
      
      if (res.ok) {
        setFiles(prev => ({ ...prev, [fileId]: editContent }));
        setEditing(null);
        setStatus({ [fileId]: 'Saved!' });
        setTimeout(() => setStatus({}), 3000);
      }
    } catch (e) {
      setStatus({ [fileId]: 'Error saving' });
    }
  };

  const uploadCustomDoc = async () => {
    if (!newDocName.trim() || !newDocContent.trim()) return;
    
    const fileName = newDocName.endsWith('.md') ? newDocName : `${newDocName}.md`;
    
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fileName, content: newDocContent })
      });
      
      if (res.ok) {
        setCustomDocs(prev => [...prev, { name: fileName, updatedAt: new Date().toISOString() }]);
        setNewDocName('');
        setNewDocContent('');
        setStatus({ custom: 'Uploaded!' });
        setTimeout(() => setStatus({}), 3000);
      }
    } catch (e) {
      setStatus({ custom: 'Error uploading' });
    }
  };

  return (
    <div style={styles.container}>
      <a href="/" style={styles.backLink}>← Back to Dashboard</a>
      
      <header style={styles.header}>
        <h1 style={styles.title}>📚 Knowledge & Instructions</h1>
        <p style={styles.subtitle}>Upload documents and update agent instructions. Changes sync to Franky's brain.</p>
      </header>

      <div style={styles.grid}>
        {INSTRUCTION_FILES.map(file => (
          <div key={file.id} style={styles.card}>
            <div style={styles.cardTitle}>
              <span>{file.icon}</span>
              <span>{file.name}</span>
            </div>
            <p style={styles.cardDesc}>{file.desc}</p>
            
            {editing === file.id ? (
              <>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={styles.textarea}
                />
                <button onClick={() => saveFile(file.id, file.name)} style={styles.button}>
                  Save Changes
                </button>
                <button onClick={() => setEditing(null)} style={styles.buttonSecondary}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div style={{...styles.textarea, minHeight: '80px', overflow: 'auto', cursor: 'default'}}>
                  {files[file.id]?.substring(0, 300) || 'Loading...'}
                  {files[file.id]?.length > 300 && '...'}
                </div>
                <button onClick={() => startEdit(file.id, files[file.id])} style={styles.button}>
                  Edit
                </button>
              </>
            )}
            
            {status[file.id] && (
              <p style={status[file.id].includes('Error') ? styles.error : styles.success}>
                {status[file.id]}
              </p>
            )}
          </div>
        ))}
      </div>

      <div style={{marginTop: '40px'}}>
        <h2 style={{fontSize: '20px', marginBottom: '20px'}}>📄 Upload Custom Knowledge</h2>
        <div style={styles.card}>
          <input
            type="text"
            placeholder="Document name (e.g., competitor-analysis)"
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            style={{...styles.textarea, minHeight: 'auto', padding: '12px', marginBottom: '10px'}}
          />
          <textarea
            value={newDocContent}
            onChange={(e) => setNewDocContent(e.target.value)}
            placeholder="Paste your document content here...

This could be:
- Competitor research
- Marketing strategies
- Content calendars
- Style guides
- Any knowledge you want Franky to have"
            style={styles.textarea}
          />
          <button onClick={uploadCustomDoc} style={styles.button}>
            Upload Document
          </button>
          {status.custom && (
            <p style={status.custom.includes('Error') ? styles.error : styles.success}>
              {status.custom}
            </p>
          )}
        </div>
      </div>

      {customDocs.length > 0 && (
        <div style={styles.fileList}>
          <h2 style={{fontSize: '20px', marginBottom: '20px'}}>📁 Uploaded Documents</h2>
          {customDocs.map((doc, i) => (
            <div key={i} style={styles.fileItem}>
              <div>
                <div style={styles.fileName}>{doc.name}</div>
                <div style={styles.fileDate}>Uploaded: {new Date(doc.updatedAt).toLocaleDateString()}</div>
              </div>
              <button style={styles.viewBtn}>View</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
