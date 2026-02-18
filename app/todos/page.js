'use client';
import { useState, useEffect } from 'react';

const styles = {
  container: { background: '#0d1117', minHeight: '100vh', color: '#c9d1d9', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' },
  header: { marginBottom: '30px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#58a6ff', marginBottom: '10px' },
  subtitle: { color: '#8b949e', fontSize: '14px' },
  backLink: { color: '#58a6ff', textDecoration: 'none', fontSize: '14px', display: 'inline-block', marginBottom: '20px' },
  addForm: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  input: { flex: 1, minWidth: '200px', padding: '12px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#c9d1d9', fontSize: '14px' },
  select: { padding: '12px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', color: '#c9d1d9', fontSize: '14px' },
  button: { padding: '12px 20px', background: '#238636', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontWeight: '600' },
  todoList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  todoItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: '#161b22', borderRadius: '8px', border: '1px solid #30363d' },
  checkbox: { width: '20px', height: '20px', cursor: 'pointer' },
  todoText: { flex: 1, fontSize: '14px' },
  completed: { textDecoration: 'line-through', color: '#8b949e' },
  priority: { padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' },
  deleteBtn: { padding: '6px 12px', background: '#f85149', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '12px' },
  stats: { display: 'flex', gap: '20px', marginBottom: '20px', padding: '15px', background: '#161b22', borderRadius: '8px' },
  stat: { textAlign: 'center' },
  statNum: { fontSize: '24px', fontWeight: 'bold' },
  statLabel: { fontSize: '12px', color: '#8b949e' },
  agent: { fontSize: '12px', color: '#8b949e', marginTop: '4px' }
};

const priorityColors = {
  high: { bg: '#f8514933', color: '#f85149' },
  normal: { bg: '#d2992233', color: '#d29922' },
  low: { bg: '#8b949e33', color: '#8b949e' }
};

export default function TodosPage() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [priority, setPriority] = useState('normal');
  const [agent, setAgent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      setTodos(data.todos || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTodo, priority, assignedAgent: agent || null })
      });
      const data = await res.json();
      if (data.success) {
        setTodos([data.todo, ...todos]);
        setNewTodo('');
        setAgent('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const res = await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !completed })
      });
      const data = await res.json();
      if (data.success) {
        setTodos(todos.map(t => t.id === id ? data.todo : t));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTodo = async (id) => {
    try {
      const res = await fetch(`/api/todos?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTodos(todos.filter(t => t.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const completed = todos.filter(t => t.completed).length;
  const pending = todos.filter(t => !t.completed).length;
  const highPriority = todos.filter(t => !t.completed && t.priority === 'high').length;

  return (
    <div style={styles.container}>
      <a href="/" style={styles.backLink}>← Back to Dashboard</a>
      
      <header style={styles.header}>
        <h1 style={styles.title}>✅ Todo List</h1>
        <p style={styles.subtitle}>Track tasks and agent assignments. Checked every 30 min.</p>
      </header>

      <div style={styles.stats}>
        <div style={styles.stat}>
          <div style={{...styles.statNum, color: '#d29922'}}>{pending}</div>
          <div style={styles.statLabel}>PENDING</div>
        </div>
        <div style={styles.stat}>
          <div style={{...styles.statNum, color: '#3fb950'}}>{completed}</div>
          <div style={styles.statLabel}>COMPLETED</div>
        </div>
        <div style={styles.stat}>
          <div style={{...styles.statNum, color: '#f85149'}}>{highPriority}</div>
          <div style={styles.statLabel}>HIGH PRIORITY</div>
        </div>
      </div>

      <form onSubmit={addTodo} style={styles.addForm}>
        <input
          type="text"
          placeholder="Add a new task..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          style={styles.input}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={styles.select}>
          <option value="high">🔴 High</option>
          <option value="normal">🟡 Normal</option>
          <option value="low">⚪ Low</option>
        </select>
        <input
          type="text"
          placeholder="Assign to agent (optional)"
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
          style={{...styles.input, maxWidth: '200px'}}
        />
        <button type="submit" style={styles.button}>Add Task</button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : todos.length === 0 ? (
        <p style={{color: '#8b949e', textAlign: 'center', padding: '40px'}}>No tasks yet. Add one above!</p>
      ) : (
        <div style={styles.todoList}>
          {todos.map(todo => (
            <div key={todo.id} style={{...styles.todoItem, opacity: todo.completed ? 0.6 : 1}}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id, todo.completed)}
                style={styles.checkbox}
              />
              <div style={{flex: 1}}>
                <div style={{...styles.todoText, ...(todo.completed ? styles.completed : {})}}>
                  {todo.text}
                </div>
                {todo.assignedAgent && (
                  <div style={styles.agent}>Assigned to: {todo.assignedAgent}</div>
                )}
              </div>
              <span style={{
                ...styles.priority,
                background: priorityColors[todo.priority]?.bg || priorityColors.normal.bg,
                color: priorityColors[todo.priority]?.color || priorityColors.normal.color
              }}>
                {todo.priority?.toUpperCase() || 'NORMAL'}
              </span>
              <button onClick={() => deleteTodo(todo.id)} style={styles.deleteBtn}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
