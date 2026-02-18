import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// SEO rules embedded from AGENT-SEO-INSTRUCTIONS.md
const SEO_RULES = {
  song: {
    titleFormat: '[Song Name] | [Theme] | Nursery Rhymes + Kids Songs',
    keywords: ['kids songs', 'nursery rhymes for kids', 'dance songs for kids', 'hip hop nursery rhymes'],
  },
  story: {
    titleFormat: '[Story Name] | [Theme] Bedtime Story | Kids Stories',
    keywords: ['bedtime stories for boys', 'kids stories', 'bedtime story', 'animated stories for kids'],
  },
  compilation: {
    titleFormat: '[Content Type] | [Duration] [Format] Compilation',
    keywords: ['kids songs compilation', 'nursery rhymes compilation', 'dance party compilation'],
  },
  short: {
    titleFormat: 'When [relatable moment] 😤🔥 #TrapNursery',
    keywords: ['trapnursery', 'kids shorts', 'nursery rhymes'],
  }
};

const UNIVERSAL_TAGS = [
  "rome's storybook",
  'nursery rhymes for kids',
  'kids cartoon',
  'animated stories for kids',
  'kids songs',
  'african american cartoons',
  'black kids cartoon',
];

const OPTIMAL_POST_TIMES = [
  { day: 'Tuesday', time: '3:00 PM' },
  { day: 'Thursday', time: '3:00 PM' },
  { day: 'Saturday', time: '10:00 AM' },
];

export async function POST(request) {
  try {
    const { script, contentType, duration } = await request.json();
    
    if (!script || !contentType) {
      return NextResponse.json({ error: 'script and contentType required' }, { status: 400 });
    }

    // Extract key info from script
    const lines = script.split('\n').filter(l => l.trim());
    const songNameMatch = script.match(/(?:song|title|name):\s*(.+)/i);
    const themeMatch = script.match(/(?:theme|about):\s*(.+)/i);
    
    const songName = songNameMatch ? songNameMatch[1].trim() : extractTitle(script);
    const theme = themeMatch ? themeMatch[1].trim() : extractTheme(script);
    
    // Generate title based on content type
    let title, shortTitle;
    const rules = SEO_RULES[contentType];
    
    // Generate theme-appropriate short titles
    const shortTitleMap = {
      'Farm Animals': `When Old McDonald starts dropping BARS 🐄🔥 #TrapNursery`,
      'Black Excellence': `When you wake up knowing you're a KING 👑🔥 #TrapNursery`,
      'Hair Affirmation': `When the braids are FRESH 💇🏾‍♂️🔥 #TrapNursery`,
      'Hair Love': `When your hair is laid 💇🏾‍♂️🔥 #TrapNursery`,
      'Dance Party': `When the beat drops at the party 🕺🔥 #TrapNursery`,
      'Bedtime': `When bedtime hits different 😴🔥 #TrapNursery`,
      'Bravery': `When the dark ain't scary no more 😤🔥 #TrapNursery`,
      'Courage': `When you face your fears 💪🔥 #TrapNursery`,
      'Lullaby': `When the stars come out ✨🔥 #TrapNursery`,
      'Construction': `When the digger starts working 🚜🔥 #TrapNursery`,
      'Vehicles': `When the truck rolls up 🚛🔥 #TrapNursery`,
      'Superhero': `When Rome saves the day 🦸🏾‍♂️🔥 #TrapNursery`,
      'Dreams': `When dreams take flight ✨🔥 #TrapNursery`,
      'Snack Time': `When the snack hits different 🍪🔥 #TrapNursery`,
    };
    
    switch (contentType) {
      case 'song':
        title = `${songName} | ${theme} Song | Nursery Rhymes + Kids Songs`;
        shortTitle = shortTitleMap[theme] || `When ${theme.toLowerCase()} hits different 😤🔥 #TrapNursery`;
        break;
      case 'story':
        title = `${songName} | ${theme} Bedtime Story | Kids Stories`;
        shortTitle = shortTitleMap[theme] || `When bedtime gets wild 😤🔥 #TrapNursery`;
        break;
      case 'compilation':
        title = `${theme} | ${duration || '30 Min'} ${songName} Compilation`;
        shortTitle = `${duration || '30 min'} of pure vibes 😤🔥 #TrapNursery`;
        break;
      case 'short':
        title = shortTitleMap[theme] || `When ${theme.toLowerCase()} 😤🔥 #TrapNursery`;
        shortTitle = title;
        break;
      default:
        title = `${songName} | ${theme} | Kids Songs`;
        shortTitle = shortTitleMap[theme] || `When it hits different 😤🔥 #TrapNursery`;
    }
    
    // Ensure title is under 50 chars
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    // Generate description (250+ words)
    const description = generateDescription(songName, theme, contentType, script, duration);
    
    // Generate tags (15-20)
    const tags = generateTags(songName, theme, contentType, rules.keywords);
    
    return NextResponse.json({
      title,
      shortTitle,
      description,
      tags,
      postTimes: OPTIMAL_POST_TIMES,
      checklist: [
        'Title under 50 characters',
        'Primary keyword in first 5 words',
        'Description 250+ words',
        'Verbal CTA in video',
        'Made for Kids = Yes'
      ]
    });
  } catch (e) {
    console.error('Generate error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function extractTitle(script) {
  // Try to find a title-like phrase
  const firstLine = script.split('\n')[0];
  if (firstLine && firstLine.length < 50) return firstLine.trim();
  
  // Extract from common words
  const words = script.split(/\s+/).slice(0, 5).join(' ');
  return words || 'Untitled Song';
}

function extractTheme(script) {
  const themes = {
    // Farm/Animals
    'mcdonald': 'Farm Animals',
    'farm': 'Farm Animals',
    'cow': 'Farm Animals',
    'pig': 'Farm Animals',
    'chicken': 'Farm Animals',
    'horse': 'Farm Animals',
    'sheep': 'Farm Animals',
    'barn': 'Farm Animals',
    // Classic nursery rhymes
    'twinkle': 'Lullaby',
    'star': 'Lullaby',
    'wheels': 'Transportation',
    'bus': 'Transportation',
    'truck': 'Vehicles',
    'digger': 'Construction',
    'excavator': 'Construction',
    // Identity/Affirmation
    'king': 'Black Excellence',
    'crown': 'Black Excellence',
    'queen': 'Black Excellence',
    'hair': 'Hair Affirmation',
    'cornrow': 'Hair Love',
    'braid': 'Hair Love',
    // Emotions/Themes
    'brave': 'Courage',
    'dark': 'Bravery',
    'scared': 'Overcoming Fear',
    'dance': 'Dance Party',
    'party': 'Dance Party',
    'bed': 'Bedtime',
    'sleep': 'Bedtime',
    'night': 'Bedtime',
    'dream': 'Dreams',
    'love': 'Self-Love',
    'gold': 'Confidence',
    'fly': 'Adventure',
    'superhero': 'Superhero',
    'hero': 'Superhero',
    // Food
    'cookie': 'Snack Time',
    'snack': 'Snack Time',
    'eat': 'Mealtime'
  };
  
  const scriptLower = script.toLowerCase();
  for (const [keyword, theme] of Object.entries(themes)) {
    if (scriptLower.includes(keyword)) return theme;
  }
  return 'Kids Song';
}

function generateDescription(songName, theme, contentType, script, duration) {
  const primaryKeyword = contentType === 'story' ? 'bedtime stories for boys' : 'nursery rhymes for kids';
  
  return `🎶 ${primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1)} that hit different! "${songName}" is an original ${contentType === 'story' ? 'bedtime story' : 'song'} from Rome's Storybook featuring ${theme.toLowerCase()} themes that kids and parents love.

Join Rome, a 5-year-old Black boy with cornrows and a gap-tooth smile, and his best friend Captain Hazelnut the teddy bear on this ${contentType === 'story' ? 'calming bedtime adventure' : 'energetic musical journey'}. Perfect for toddlers, preschoolers, and kids ages 3-7 who love ${contentType === 'story' ? 'stories before bed' : 'dancing and singing along'}.

Rome's Storybook brings you Pixar-quality 3D animation with hip-hop, trap, and Afrobeat-inspired ${contentType === 'story' ? 'soundtracks' : 'music'} that makes ${primaryKeyword} actually fun for the whole family. This is #TrapNursery — where ${primaryKeyword} meet modern beats and positive, identity-affirming messages.

Why parents love Rome's Storybook:
✨ Clean, age-appropriate content with no scary scenes
🎵 Catchy ${contentType === 'story' ? 'background music' : 'songs'} that won't drive you crazy
👑 Positive representation for Black children
🌙 ${contentType === 'story' ? 'Calming stories perfect for bedtime routine' : 'Energetic songs perfect for dance parties'}
💪 Confidence-building messages about self-love and identity

What's inside this ${contentType === 'compilation' ? duration + ' compilation' : 'video'}:
🕺 ${theme} themes throughout
🎵 Original music with hip-hop beats
✨ Beautiful 3D Pixar-style animation
🔥 Rome and Captain Hazelnut adventures

Subscribe to Rome's Storybook for new animated ${contentType === 'story' ? 'bedtime stories' : 'songs'}, ${primaryKeyword}, and kids content every week! Hit the bell so you never miss a new upload.

#NurseryRhymes #KidsSongs #TrapNursery #BlackKidsMatter #BedtimeStories #RomesStorybook #KidsCartoon #ToddlerMusic #PreschoolSongs #AnimatedKidsContent`;
}

function generateTags(songName, theme, contentType, typeKeywords) {
  const tags = new Set();
  
  // Primary keyword first
  tags.add(contentType === 'story' ? 'bedtime stories for boys' : 'nursery rhymes for kids');
  
  // Song/content specific
  tags.add(songName.toLowerCase());
  tags.add(`${theme.toLowerCase()} song for kids`);
  
  // Type-specific keywords
  typeKeywords.forEach(kw => tags.add(kw));
  
  // Universal tags
  UNIVERSAL_TAGS.forEach(tag => tags.add(tag));
  
  // Additional relevant tags
  const additionalTags = [
    'toddler songs',
    'preschool songs',
    'kids dance party',
    'hip hop for kids',
    'trap nursery rhymes',
    'black boy cartoon',
    'positive kids content',
    'kids music videos',
    '3d animation for kids'
  ];
  
  additionalTags.forEach(tag => {
    if (tags.size < 20) tags.add(tag);
  });
  
  return Array.from(tags).slice(0, 20);
}
