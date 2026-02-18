# Rome's Storybook Agent Monitor - Audit Report

**Audited:** 2026-02-18  
**Auditor:** Codex Dashboard Audit Subagent  

---

## 1. What's Working ✅

### Progress Goals (Requirement #1) ✅
- **Status:** WORKING
- Main page (`app/page.js`) correctly fetches from `/api/progress`
- API route (`app/api/progress/route.js`) reads/writes to Redis
- Real data is being displayed (verified: X Followers = 35, YouTube Subs = 108)
- Auto-refresh every 30 seconds

### Rules Page Persistence (Requirement #3) ✅
- **Status:** WORKING (with category mismatch issue - see below)
- Full CRUD operations via `/api/rules`
- Redis persistence working
- Can add, edit, delete, toggle status

### Redis Integration ✅
- `lib/kv.js` properly configured with Upstash Redis
- Environment variables in `.env.local` are valid
- Verified: Progress, Rules, Skills, Todos all persist to Redis

### Core Dashboard Features ✅
- Agent status display with real-time state
- Navigation between pages (Rules, Skills, Memory, Knowledge)
- Responsive design with good mobile support

---

## 2. What's Broken or Missing 🚨

### Skills Page (Requirement #2) - PARTIALLY WORKING
**Problem:** Skills page displays `trigger` and `description` fields but the Skills API doesn't return them in the expected format, and the UI doesn't handle missing fields gracefully.

**Issues Found:**
1. `app/skills/page.js` expects `skill.trigger` and `skill.description`
2. Skills in Redis have `trigger` but no `description`
3. UI shows "undefined" for missing fields

### TODO Checklist (Requirement #4) - API ONLY
**Problem:** The `/api/todos` endpoint exists and works, but there's NO UI page for it!

**Missing:**
- No `/app/todos/page.js` 
- No link to todos in navigation
- API is complete but users can't access it

### Content Pipeline View (Requirement #5) - MISSING
**Problem:** No content pipeline view exists anywhere in the app.

**Needed:**
- View for content-queue.md status
- Pipeline stages: Draft → Ready → Posted
- Link from main dashboard

### Last Upload Performance View (Requirement #6) - MISSING
**Problem:** No dedicated upload performance tracking.

**Partial:** `topContent` exists in progress data but isn't properly displayed.

### Memory API - NOT PERSISTED
**Problem:** Memory API uses in-memory storage, NOT Redis!

**Code in `app/api/memory/route.js`:**
```javascript
let memoryCache = {}; // ← This resets on server restart!
```

### Agents API - HARDCODED DATA
**Problem:** `/api/agents` returns mock data, not real OpenClaw agent data.

**Issue:** The agents array is hardcoded with `Date.now()` for timestamps, making it look dynamic but it's fake data.

### Rules Page Category Mismatch
**Problem:** UI categories don't match API data.

| UI Categories | API Categories |
|---------------|----------------|
| `forbidden` 🚫 | (not used) |
| `posting` 📋 | `posting` |
| `qa` ✅ | (not used) |
| (missing) | `process` |
| (missing) | `youtube` |

**Result:** Rules with `process` or `youtube` category don't display at all!

---

## 3. Specific Code Fixes Needed

### FIX 1: Skills API - Add Missing Fields (Priority: HIGH)

**File:** `app/api/skills/route.js`

```javascript
// Change DEFAULT_SKILLS to include all fields:
const DEFAULT_SKILLS = [
  { 
    id: 'first-principles-thinking', 
    name: 'First Principles Thinking', 
    trigger: 'Before titles, timing, or strategy recommendations',
    description: 'Break down assumptions and analyze from fundamentals',
    lastUsed: null, 
    useCount: 0 
  },
  { 
    id: 'x-native-video-poster', 
    name: 'X Native Video Poster', 
    trigger: 'When posting video to @RomesStorybook on X',
    description: 'Upload native video with optimized settings',
    lastUsed: null, 
    useCount: 0 
  },
  // ... etc for all skills
];
```

### FIX 2: Skills Page - Handle Missing Fields (Priority: HIGH)

**File:** `app/skills/page.js`

```javascript
// Around line 57, update to handle missing fields:
<p style={styles.description}>{skill.description || 'No description'}</p>
<div style={styles.trigger}>
  <strong>Trigger:</strong> {skill.trigger || 'Not specified'}
</div>
```

### FIX 3: Create TODO Page (Priority: HIGH)

**File to create:** `app/todos/page.js`

```javascript
'use client';
import { useState, useEffect } from 'react';

export default function TodosPage() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const res = await fetch('/api/todos');
    const data = await res.json();
    setTodos(data.todos || []);
    setLoading(false);
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newTodo, priority: 'normal' })
    });
    setNewTodo('');
    fetchTodos();
  };

  const toggleTodo = async (id, completed) => {
    await fetch('/api/todos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed: !completed })
    });
    fetchTodos();
  };

  const deleteTodo = async (id) => {
    await fetch(`/api/todos?id=${id}`, { method: 'DELETE' });
    fetchTodos();
  };

  const styles = {
    container: { background: '#0d1117', minHeight: '100vh', color: '#c9d1d9', padding: '20px', fontFamily: 'system-ui' },
    title: { fontSize: '24px', color: '#58a6ff', marginBottom: '20px' },
    inputRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
    input: { flex: 1, padding: '12px', background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', color: '#c9d1d9' },
    btn: { background: '#238636', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer' },
    todoItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: '#161b22', borderRadius: '8px', marginBottom: '8px', border: '1px solid #30363d' },
    checkbox: { width: '20px', height: '20px', cursor: 'pointer' },
    todoText: { flex: 1, fontSize: '15px' },
    deleteBtn: { background: '#f8514930', color: '#f85149', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' },
    backLink: { color: '#58a6ff', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }
  };

  return (
    <div style={styles.container}>
      <a href="/" style={styles.backLink}>← Back to Dashboard</a>
      <h1 style={styles.title}>📋 TODO Checklist</h1>
      
      <div style={styles.inputRow}>
        <input 
          style={styles.input} 
          placeholder="Add new task..." 
          value={newTodo} 
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
        />
        <button style={styles.btn} onClick={addTodo}>Add</button>
      </div>

      {loading ? <p>Loading...</p> : (
        todos.length === 0 ? <p style={{color: '#8b949e'}}>No tasks yet. Add one above!</p> : (
          todos.map(todo => (
            <div key={todo.id} style={{...styles.todoItem, opacity: todo.completed ? 0.5 : 1}}>
              <input 
                type="checkbox" 
                style={styles.checkbox} 
                checked={todo.completed} 
                onChange={() => toggleTodo(todo.id, todo.completed)}
              />
              <span style={{...styles.todoText, textDecoration: todo.completed ? 'line-through' : 'none'}}>
                {todo.text}
              </span>
              <button style={styles.deleteBtn} onClick={() => deleteTodo(todo.id)}>Delete</button>
            </div>
          ))
        )
      )}
    </div>
  );
}
```

### FIX 4: Add TODO Link to Navigation (Priority: HIGH)

**File:** `app/page.js`

Add to the nav section (around line 50):
```javascript
<a href="/todos" style={{color: '#58a6ff', textDecoration: 'none', padding: '8px 12px', background: '#21262d', borderRadius: '6px', fontSize: '14px'}}>📋 Todos</a>
```

### FIX 5: Rules Page - Fix Categories (Priority: MEDIUM)

**File:** `app/rules/page.js`

```javascript
// Change categories object to match API:
const categories = {
  forbidden: { label: '🚫 FORBIDDEN', color: '#f85149' },
  posting: { label: '📋 Posting Rules', color: '#d29922' },
  process: { label: '⚙️ Process', color: '#58a6ff' },
  youtube: { label: '🎬 YouTube', color: '#ff0000' },
  qa: { label: '✅ QA Checklist', color: '#3fb950' },
  general: { label: '📝 General', color: '#8b949e' }
};
```

### FIX 6: Memory API - Use Redis (Priority: HIGH)

**File:** `app/api/memory/route.js`

Replace in-memory storage with Redis:
```javascript
import { NextResponse } from 'next/server';
import redis from '@/lib/kv';

export const dynamic = 'force-dynamic';

const MEMORY_KEY = 'franky:memory';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');

  try {
    const memoryCache = await redis.get(MEMORY_KEY) || {};
    
    if (file) {
      const content = memoryCache[file];
      return NextResponse.json({ file, content: content || `[File "${file}" not synced yet]` });
    }

    const files = Object.keys(memoryCache);
    return NextResponse.json({ files: files.length ? files : ['MEMORY.md', 'SOUL.md', 'AGENTS.md'] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    let memoryCache = await redis.get(MEMORY_KEY) || {};
    
    if (body.files && typeof body.files === 'object') {
      memoryCache = { ...memoryCache, ...body.files };
      await redis.set(MEMORY_KEY, memoryCache);
      return NextResponse.json({ success: true, synced: Object.keys(body.files) });
    }
    
    if (body.file && body.content) {
      memoryCache[body.file] = body.content;
      await redis.set(MEMORY_KEY, memoryCache);
      return NextResponse.json({ success: true, synced: [body.file] });
    }
    
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { file, content } = await request.json();
    if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 });
    
    let memoryCache = await redis.get(MEMORY_KEY) || {};
    memoryCache[file] = content;
    await redis.set(MEMORY_KEY, memoryCache);
    return NextResponse.json({ success: true, updated: file });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

### FIX 7: Add Content Pipeline Section to Main Page (Priority: MEDIUM)

**File:** `app/page.js` - Add after progress section:

```javascript
{/* Content Pipeline */}
<div style={{...styles.progress, marginTop: '20px'}}>
  <span style={styles.progressTitle}>📼 Content Pipeline</span>
  <p style={{color: '#8b949e', marginBottom: '15px'}}>Check content-queue.md for full details</p>
  <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
    <a href="/knowledge" style={{padding: '15px 25px', background: '#21262d', borderRadius: '8px', color: '#58a6ff', textDecoration: 'none'}}>
      View Content Queue →
    </a>
  </div>
</div>
```

### FIX 8: Add Top Content Performance to Main Page (Priority: MEDIUM)

**File:** `app/page.js` - The `topContent` data exists in progress API. Add display:

```javascript
{/* Top Content Performance - add inside progress section */}
{goals.topContent && goals.topContent.length > 0 && (
  <div style={{marginTop: '25px', padding: '15px', background: '#0d1117', borderRadius: '8px'}}>
    <span style={{fontWeight: '600', marginBottom: '10px', display: 'block'}}>🔥 Recent Upload Performance</span>
    {goals.topContent.map((item, i) => (
      <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #21262d'}}>
        <span>{item.title}</span>
        <span style={{color: '#3fb950'}}>{item.views} views ({item.platform})</span>
      </div>
    ))}
  </div>
)}
```

---

## 4. Priority Order for Fixes

| Priority | Fix | Effort | Impact |
|----------|-----|--------|--------|
| 🔴 P1 | Create TODO Page (Fix 3 & 4) | 30 min | Terry explicitly requested this |
| 🔴 P1 | Fix Memory API to use Redis (Fix 6) | 15 min | Data loss on restart |
| 🟡 P2 | Fix Skills page missing fields (Fix 1 & 2) | 20 min | Requirement #2 |
| 🟡 P2 | Add Top Content Performance (Fix 8) | 15 min | Requirement #6 |
| 🟢 P3 | Fix Rules categories (Fix 5) | 10 min | Some rules hidden |
| 🟢 P3 | Add Content Pipeline link (Fix 7) | 10 min | Requirement #5 |
| ⚪ P4 | Replace hardcoded Agents API | 2+ hrs | Needs OpenClaw integration |

---

## 5. Summary

**Working:** 5/7 Terry requirements partially or fully met  
**Critical Issues:** 3 (TODO page missing, Memory not persisted, Skills incomplete)  
**Estimated Fix Time:** ~2 hours for P1/P2 fixes

The app has a solid foundation. Main issues are:
1. Missing TODO UI (API exists!)
2. Memory API loses data on restart (not using Redis)
3. Skills page doesn't show triggers properly
4. Rules categories don't match

After implementing the P1 and P2 fixes above, this app will be production-ready for Terry's use case.
