'use client';
import { useState, useEffect } from 'react';

const categories = {
  forbidden: { label: '🚫 FORBIDDEN', color: '#f85149' },
  posting: { label: '📋 Posting Rules', color: '#d29922' },
  qa: { label: '✅ QA Checklist', color: '#3fb950' }
};

export default function RulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [newRule, setNewRule] = useState({ text: '', category: 'posting', status: 'active' });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/rules');
      const data = await res.json();
      setRules(data.rules || []);
    } catch (e) {
      console.error('Failed to fetch rules:', e);
    }
    setLoading(false);
  };

  const addRule = async () => {
    if (!newRule.text.trim()) return;
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      });
      if (res.ok) {
        setNewRule({ text: '', category: 'posting', status: 'active' });
        setShowAdd(false);
        fetchRules();
      }
    } catch (e) {
      console.error('Failed to add rule:', e);
    }
  };

  const startEdit = (rule) => {
    setEditingId(rule.id);
    setEditText(rule.text);
    setEditStatus(rule.status);
  };

  const saveEdit = async (id) => {
    try {
      await fetch('/api/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, text: editText, status: editStatus })
      });
      setEditingId(null);
      fetchRules();
    } catch (e) {
      console.error('Failed to update rule:', e);
    }
  };

  const deleteRule = async (id) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await fetch(`/api/rules?id=${id}`, { method: 'DELETE' });
      fetchRules();
    } catch (e) {
      console.error('Failed to delete rule:', e);
    }
  };

  const styles = {
    container: { background: '#0d1117', minHeight: '100vh', color: '#c9d1d9', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    title: { fontSize: '28px', color: '#58a6ff' },
    addBtn: { background: '#238636', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' },
    section: { marginBottom: '40px' },
    sectionTitle: { fontSize: '22px', marginBottom: '15px' },
    card: { background: '#161b22', borderRadius: '12px', border: '1px solid #30363d' },
    ruleRow: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #21262d' },
    ruleText: { flex: 1, fontSize: '15px', marginRight: '15px' },
    status: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', marginRight: '15px', cursor: 'pointer' },
    actions: { display: 'flex', gap: '8px' },
    btn: { background: '#30363d', color: '#c9d1d9', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
    deleteBtn: { background: '#f8514930', color: '#f85149' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: '#161b22', padding: '30px', borderRadius: '16px', width: '500px', maxWidth: '90%', border: '1px solid #30363d' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #30363d', background: '#0d1117', color: '#c9d1d9', fontSize: '15px', marginBottom: '15px', boxSizing: 'border-box' },
    select: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #30363d', background: '#0d1117', color: '#c9d1d9', fontSize: '15px', marginBottom: '15px' },
    backLink: { color: '#58a6ff', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' },
    statusToggle: { display: 'flex', gap: '10px', marginBottom: '15px' },
    statusBtn: { padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px' }
  };

  if (loading) {
    return <div style={styles.container}><p>Loading rules from server...</p></div>;
  }

  return (
    <div style={styles.container}>
      <a href="/" style={styles.backLink}>← Back to Dashboard</a>
      
      <div style={styles.header}>
        <h1 style={styles.title}>🐙 QA Rules & Guidelines</h1>
        <button style={styles.addBtn} onClick={() => setShowAdd(true)}>+ Add Rule</button>
      </div>

      <p style={{color: '#8b949e', marginBottom: '20px'}}>
        ✅ Rules stored on server (persistent). Click status badge to toggle ACTIVE/PENDING.
      </p>

      {Object.entries(categories).map(([key, cat]) => {
        const categoryRules = rules.filter(r => r.category === key);
        if (categoryRules.length === 0) return null;
        
        return (
          <div key={key} style={styles.section}>
            <h2 style={{...styles.sectionTitle, color: cat.color}}>{cat.label}</h2>
            <div style={{...styles.card, borderColor: cat.color, borderWidth: key === 'forbidden' ? '2px' : '1px'}}>
              {categoryRules.map((rule, i) => (
                <div key={rule.id} style={{...styles.ruleRow, borderBottom: i === categoryRules.length - 1 ? 'none' : '1px solid #21262d'}}>
                  {editingId === rule.id ? (
                    <>
                      <input
                        style={{...styles.input, marginBottom: 0, flex: 1, marginRight: '10px'}}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(rule.id)}
                        autoFocus
                      />
                      <select 
                        style={{...styles.select, width: 'auto', marginBottom: 0, marginRight: '10px'}}
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        <option value="active">ACTIVE</option>
                        <option value="pending">PENDING</option>
                      </select>
                    </>
                  ) : (
                    <span style={styles.ruleText}>{rule.text}</span>
                  )}
                  {editingId !== rule.id && (
                    <span 
                      style={{
                        ...styles.status,
                        background: rule.status === 'active' ? '#23863630' : '#d2992230',
                        color: rule.status === 'active' ? '#3fb950' : '#d29922'
                      }}
                      onClick={async () => {
                        await fetch('/api/rules', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: rule.id, status: rule.status === 'active' ? 'pending' : 'active' })
                        });
                        fetchRules();
                      }}
                      title="Click to toggle status"
                    >
                      {rule.status === 'active' ? 'ACTIVE' : 'PENDING'}
                    </span>
                  )}
                  <div style={styles.actions}>
                    {editingId === rule.id ? (
                      <>
                        <button style={{...styles.btn, background: '#238636'}} onClick={() => saveEdit(rule.id)}>Save</button>
                        <button style={styles.btn} onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button style={styles.btn} onClick={() => startEdit(rule)}>Edit</button>
                        <button style={{...styles.btn, ...styles.deleteBtn}} onClick={() => deleteRule(rule.id)}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {showAdd && (
        <div style={styles.modal} onClick={() => setShowAdd(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{marginBottom: '20px', color: '#c9d1d9'}}>Add New Rule</h2>
            <textarea
              style={{...styles.input, minHeight: '100px', resize: 'vertical'}}
              placeholder="Enter rule text..."
              value={newRule.text}
              onChange={(e) => setNewRule({...newRule, text: e.target.value})}
              autoFocus
            />
            <select
              style={styles.select}
              value={newRule.category}
              onChange={(e) => setNewRule({...newRule, category: e.target.value})}
            >
              <option value="forbidden">🚫 Forbidden</option>
              <option value="posting">📋 Posting Rule</option>
              <option value="qa">✅ QA Checklist</option>
            </select>
            <select
              style={styles.select}
              value={newRule.status}
              onChange={(e) => setNewRule({...newRule, status: e.target.value})}
            >
              <option value="active">Active</option>
              <option value="pending">Pending Implementation</option>
            </select>
            <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
              <button style={styles.addBtn} onClick={addRule}>Add Rule</button>
              <button style={{...styles.btn, padding: '12px 24px'}} onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
