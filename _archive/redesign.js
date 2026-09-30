const fs = require('fs');

function processFile(filepath) {
    console.log(`Processing ${filepath}...`);
    if (!fs.existsSync(filepath)) return;
    
    let content = fs.readFileSync(filepath, 'utf8');

    content = content.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Outfit.*?rel="stylesheet">/g, '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap" rel="stylesheet">');

    const newVars = ":root { --bg-dark: #030305; --surface: #101014; --surface-hover: #16161d; --accent: #4ade80; --accent-hover: #22c55e; --text-main: #f4f4f5; --text-muted: #a1a1aa; --border: #27272a; --danger: #ef4444; --success: #10b981; --font-sans: 'Plus Jakarta Sans', sans-serif; --font-serif: 'Syne', sans-serif; --transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }";
    content = content.replace(/:root\s*\{[^}]+\}/g, newVars);

    // Let's use NEON GREEN (#4ade80) and Deep Space since user wanted something different, let's stick to the Indigo/Neon Green vibe. Wait, I said Indigo in the plan, so I should use Indigo!
    const newVarsIndigo = ":root { --bg-dark: #030305; --surface: #101014; --surface-hover: #16161d; --accent: #5e6ad2; --accent-hover: #7b86e8; --text-main: #f4f4f5; --text-muted: #a1a1aa; --border: rgba(94, 106, 210, 0.2); --danger: #ef4444; --success: #10b981; --font-sans: 'Plus Jakarta Sans', sans-serif; --font-serif: 'Syne', sans-serif; --transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }";
    content = content.replace(/:root\s*\{[^}]+\}/g, newVarsIndigo);

    content = content.replace(/var\(--gold\)/g, 'var(--accent)');
    content = content.replace(/var\(--gold-hover\)/g, 'var(--accent-hover)');

    content = content.replace(/#C5A880/g, '#5e6ad2');
    content = content.replace(/#D4AF37/g, '#5e6ad2');
    content = content.replace(/#0B0C10/g, '#030305');
    
    // Rgba updates
    content = content.replace(/rgba\(197, 168, 128/g, 'rgba(94, 106, 210');
    content = content.replace(/rgba\(197,168,128/g, 'rgba(94,106,210');
    content = content.replace(/rgba\(212,175,55/g, 'rgba(94,106,210');
    content = content.replace(/rgba\(212, 175, 55/g, 'rgba(94, 106, 210');

    content = content.replace(/gold-text/g, 'accent-text');

    content = content.replace(/@keyframes revealLuxury[\s\S]*?\}/g, '@keyframes popIn { 0% { opacity: 0; transform: scale(0.9) translateY(15px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }');
    content = content.replace(/revealLuxury/g, 'popIn');

    content = content.replace(/backdrop-filter:\s*blur\([^)]+\);/g, '');
    content = content.replace(/-webkit-backdrop-filter:\s*blur\([^)]+\);/g, '');

    content = content.replace(/border-radius:\s*20px;/g, 'border-radius: 8px;');
    content = content.replace(/border-radius:\s*24px;/g, 'border-radius: 10px;');
    content = content.replace(/border-radius:\s*12px;/g, 'border-radius: 6px;');
    content = content.replace(/border-radius:\s*16px;/g, 'border-radius: 8px;');

    content = content.replace(/padding:\s*30px;\s*box-shadow:\s*0\s*20px\s*50px[^;]+;/g, 'padding: 30px; box-shadow: 0 0 40px rgba(94, 106, 210, 0.05);');
    content = content.replace(/border-style:\s*solid;/g, 'border-style: solid; box-shadow: 0 0 30px rgba(94, 106, 210, 0.05);');

    fs.writeFileSync(filepath, content);
}

const files = [
    'c:/Users/user/Desktop/baber123123/index.html',
    'c:/Users/user/Desktop/baber123123/ai_style.html',
    'c:/Users/user/Desktop/baber123123/admin.html'
];

files.forEach(processFile);
console.log("Done");
