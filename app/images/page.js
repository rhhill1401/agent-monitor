'use client';
import { useState } from 'react';

const styles = {
  container: { background: '#0d1117', minHeight: '100vh', color: '#c9d1d9', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' },
  header: { marginBottom: '30px', borderBottom: '1px solid #30363d', paddingBottom: '20px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#58a6ff' },
  backLink: { color: '#58a6ff', textDecoration: 'none', fontSize: '14px' },
  card: { background: '#161b22', borderRadius: '12px', padding: '20px', border: '1px solid #30363d', marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', color: '#8b949e', fontSize: '14px', fontWeight: '500' },
  input: { width: '100%', padding: '12px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', color: '#c9d1d9', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '12px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', color: '#c9d1d9', fontSize: '16px', marginBottom: '16px', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box' },
  select: { width: '100%', padding: '12px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', color: '#c9d1d9', fontSize: '16px', marginBottom: '16px', cursor: 'pointer', boxSizing: 'border-box' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  button: { padding: '14px 28px', background: '#238636', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' },
  buttonDisabled: { background: '#30363d', cursor: 'not-allowed' },
  buttonSecondary: { padding: '12px 24px', background: '#21262d', color: '#58a6ff', border: '1px solid #30363d', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  imageArea: { minHeight: '300px', background: '#0d1117', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #30363d', marginTop: '20px' },
  generatedImage: { maxWidth: '100%', maxHeight: '500px', borderRadius: '8px' },
  message: { color: '#8b949e', textAlign: 'center', padding: '40px' },
  presetChips: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' },
  chip: { padding: '6px 12px', background: '#21262d', border: '1px solid #30363d', borderRadius: '20px', color: '#c9d1d9', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' },
  chipActive: { background: '#238636', borderColor: '#238636' },
  sectionTitle: { color: '#c9d1d9', fontSize: '16px', fontWeight: '600', marginBottom: '12px', marginTop: '16px' },
  error: { color: '#f85149', padding: '12px', background: '#1c1c1c', borderRadius: '8px', marginTop: '16px' },
  success: { color: '#3fb950', padding: '12px', background: '#1c1c1c', borderRadius: '8px', marginTop: '16px' }
};

const CHARACTER_PRESETS = [
  { id: 'rome', name: 'Rome', description: '5 year old Black boy with cornrows and a gap tooth, cute and energetic' },
  { id: 'captain-hazelnut', name: 'Captain Hazelnut', description: 'a friendly brown teddy bear with a captain hat' },
  { id: 'rome-farmer', name: 'Rome as Farmer', description: '5 year old Black boy with cornrows and gap tooth, wearing overalls and a straw hat' },
  { id: 'cow', name: 'Cow', description: 'a friendly cartoon cow with big eyes' },
  { id: 'pig', name: 'Pig', description: 'a cute pink pig with a curly tail' },
  { id: 'chicken', name: 'Chicken', description: 'a cheerful chicken with orange feathers' },
  { id: 'horse', name: 'Horse', description: 'a gentle brown horse with a flowing mane' },
  { id: 'sheep', name: 'Sheep', description: 'a fluffy white sheep with a happy face' }
];

const SCENE_PRESETS = [
  { id: 'farm', name: 'Farm Scene', description: 'on a sunny farm with a red barn, green fields, and a blue sky' },
  { id: 'bedroom', name: 'Bedroom/Bedtime', description: 'in a cozy bedroom at night with soft lighting, a bed with colorful blankets, and stars visible through the window' },
  { id: 'dance-party', name: 'Dance Party', description: 'at a fun dance party with colorful lights, balloons, and confetti' },
  { id: 'outdoor-adventure', name: 'Outdoor Adventure', description: 'on an exciting outdoor adventure in a forest with tall trees, a path, and butterflies' }
];

const STYLE_PRESETS = [
  { id: 'pixar', name: 'Pixar 3D', prompt: 'Pixar-style 3D animation, vibrant colors, smooth textures, expressive characters' },
  { id: 'cartoon', name: 'Cartoon', prompt: 'colorful 2D cartoon style, bold outlines, playful and fun' },
  { id: 'realistic', name: 'Realistic', prompt: 'photorealistic, detailed, natural lighting' }
];

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('pixar');
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [selectedScene, setSelectedScene] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const buildFullPrompt = () => {
    const parts = [];
    
    // Add style
    const stylePreset = STYLE_PRESETS.find(s => s.id === style);
    if (stylePreset) parts.push(stylePreset.prompt);
    
    // Add character if selected
    if (selectedCharacter) {
      const char = CHARACTER_PRESETS.find(c => c.id === selectedCharacter);
      if (char) parts.push(char.description);
    }
    
    // Add scene if selected
    if (selectedScene) {
      const scene = SCENE_PRESETS.find(s => s.id === selectedScene);
      if (scene) parts.push(scene.description);
    }
    
    // Add custom prompt
    if (prompt.trim()) parts.push(prompt.trim());
    
    return parts.join(', ');
  };

  const handleGenerate = async () => {
    const fullPrompt = buildFullPrompt();
    if (!fullPrompt) {
      setError('Please enter a prompt or select a character/scene');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    setImageUrl(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt })
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.message) {
        setMessage(data.message);
      } else if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      }
    } catch (e) {
      setError('Failed to generate image: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${Date.now()}.png`;
    link.click();
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={styles.title}>🎨 Image Generator</h1>
          <a href="/" style={styles.backLink}>← Back to Monitor</a>
        </div>
      </header>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>✨ Style</h2>
        <div style={styles.presetChips}>
          {STYLE_PRESETS.map(s => (
            <button
              key={s.id}
              style={{ ...styles.chip, ...(style === s.id ? styles.chipActive : {}) }}
              onClick={() => setStyle(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>

        <h2 style={styles.sectionTitle}>👦 Character</h2>
        <div style={styles.presetChips}>
          <button
            style={{ ...styles.chip, ...(selectedCharacter === '' ? styles.chipActive : {}) }}
            onClick={() => setSelectedCharacter('')}
          >
            None
          </button>
          {CHARACTER_PRESETS.map(c => (
            <button
              key={c.id}
              style={{ ...styles.chip, ...(selectedCharacter === c.id ? styles.chipActive : {}) }}
              onClick={() => setSelectedCharacter(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <h2 style={styles.sectionTitle}>🏞️ Scene</h2>
        <div style={styles.presetChips}>
          <button
            style={{ ...styles.chip, ...(selectedScene === '' ? styles.chipActive : {}) }}
            onClick={() => setSelectedScene('')}
          >
            None
          </button>
          {SCENE_PRESETS.map(s => (
            <button
              key={s.id}
              style={{ ...styles.chip, ...(selectedScene === s.id ? styles.chipActive : {}) }}
              onClick={() => setSelectedScene(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>

        <h2 style={styles.sectionTitle}>📝 Additional Details</h2>
        <textarea
          style={styles.textarea}
          placeholder="Add any extra details to your image prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div style={{ background: '#0d1117', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          <label style={{ ...styles.label, marginBottom: '4px' }}>Full Prompt Preview:</label>
          <p style={{ color: '#c9d1d9', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
            {buildFullPrompt() || '(Select options or enter a prompt)'}
          </p>
        </div>

        <button
          style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? '⏳ Generating...' : '🚀 Generate Image'}
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>🖼️ Generated Image</h2>
        
        {error && <div style={styles.error}>⚠️ {error}</div>}
        {message && <div style={styles.success}>ℹ️ {message}</div>}
        
        <div style={styles.imageArea}>
          {loading ? (
            <div style={styles.message}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <p>Generating your image...</p>
            </div>
          ) : imageUrl ? (
            <img src={imageUrl} alt="Generated" style={styles.generatedImage} />
          ) : (
            <div style={styles.message}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
              <p>Your generated image will appear here</p>
            </div>
          )}
        </div>

        {imageUrl && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            <button style={styles.buttonSecondary} onClick={handleDownload}>
              📥 Download Image
            </button>
            <button style={styles.buttonSecondary} onClick={() => navigator.clipboard.writeText(imageUrl)}>
              📋 Copy URL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
