const fs = require('fs');

function processFile(filepath) {
    if (!fs.existsSync(filepath)) return;
    let content = fs.readFileSync(filepath, 'utf8');

    // 1. Update Fonts
    content = content.replace(
        /<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=[^"]+" rel="stylesheet">/g,
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Syncopate:wght@400;700&display=swap" rel="stylesheet">'
    );
    
    // Update css root variables for fonts
    content = content.replace(/--font-sans:\s*'[^']+',\s*sans-serif;/g, "--font-sans: 'Inter', sans-serif;");
    content = content.replace(/--font-serif:\s*'[^']+',\s*sans-serif;/g, "--font-serif: 'Syncopate', sans-serif;");

    // 2. Overhaul CSS Variables Default (DARK)
    content = content.replace(/--bg-dark:\s*#[a-f0-9A-F]+;/g, "--bg-dark: #000000;");
    content = content.replace(/--surface:\s*#[a-f0-9A-F]+;/g, "--surface: #0a0a0e;");
    content = content.replace(/--surface-hover:\s*#[a-f0-9A-F]+;/g, "--surface-hover: #12121a;");
    
    // Change accent to pure white (or stark black if in light mode, but let's change value directly)
    content = content.replace(/--accent:\s*#[a-f0-9A-F]+;/g, "--accent: #ffffff;");
    content = content.replace(/--accent-hover:\s*#[a-f0-9A-F]+;/g, "--accent-hover: #cccccc;");
    content = content.replace(/--text-main:\s*#[a-f0-9A-F]+;/g, "--text-main: #ffffff;");
    content = content.replace(/--text-muted:\s*#[a-f0-9A-F]+;/g, "--text-muted: #888888;");
    content = content.replace(/--border:\s*rgba\([^)]+\);/g, "--border: rgba(255,255,255,0.2);");
    
    // Overlays for borders/backgrounds
    content = content.replace(/--overlay-light:\s*rgba\([^)]+\);/g, "--overlay-light: rgba(255,255,255,0.05);");
    content = content.replace(/--overlay-mid:\s*rgba\([^)]+\);/g, "--overlay-mid: rgba(255,255,255,0.15);");
    content = content.replace(/--overlay-heavy:\s*rgba\([^)]+\);/g, "--overlay-heavy: rgba(255,255,255,0.3);");

    // 3. Modifying the LIGHT THEME specifically
    const lightThemeTarget = `[data-theme="light"] {
            --bg-dark: #ffffff;
            --surface: #f4f4f5;
            --surface-hover: #e4e4e7;
            --accent: #000000;
            --accent-hover: #333333;
            --text-main: #000000;
            --text-muted: #777777;
            --border: rgba(0,0,0,0.2);
            --overlay-light: rgba(0,0,0,0.05);
            --overlay-mid: rgba(0,0,0,0.15);
            --overlay-heavy: rgba(0,0,0,0.3);
            --header-grad: transparent;
        }`;
    content = content.replace(/\[data-theme="light"\]\s*\{[^}]+\}/g, lightThemeTarget);

    // 4. Updating specific body style for the Glow
    // Add radial gradient glow to body background
    content = content.replace(/body\s*\{\s*background-color:\s*var\(--bg-dark\);/g, 'body { background-color: var(--bg-dark); background-image: radial-gradient(circle at 50% 0%, var(--overlay-mid) 0%, transparent 40%), radial-gradient(circle at 50% 100%, var(--overlay-light) 0%, transparent 50%); background-attachment: fixed;');

    // 5. Typography transforms
    // Syncopate needs letter spacing and uppercase to match the image headers
    content = content.replace(/h1, h2, h3 \{ font-family: var\(--font-serif\); font-weight:\s*600; \}/g, 'h1, h2, h3 { font-family: var(--font-serif); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }');
    content = content.replace(/h2, h3, h4 \{ font-family: var\(--font-serif\); font-weight:\s*600;\s*margin-bottom: 20px;\}/g, 'h2, h3, h4 { font-family: var(--font-serif); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; }');
    
    // 6. Pill shape for Buttons and Inputs
    // .form-control padding and border radius
    content = content.replace(/padding:\s*15px;\s*border-radius:\s*[0-9]+px;/g, 'padding: 16px 24px; border-radius: 999px;');
    // .btn padding and border radius
    content = content.replace(/\.btn\s*\{[^}]+\}/g, (match) => {
        let n = match.replace(/border-radius:\s*[0-9]+px;/, 'border-radius: 999px;');
        n = n.replace(/padding:\s*16px;/, 'padding: 16px 30px;');
        n = n.replace(/font-size:\s*1\.1rem;/, 'font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;');
        if (!n.includes('border:')) n = n.replace(/color:\s*var\(--bg-dark\);/, 'color: var(--bg-dark); border: 1px solid var(--accent);');
        return n;
    });

    // 7. Outline buttons and specific elements
    content = content.replace(/\.btn-outline\s*\{[^}]+\}/g, '.btn-outline { background: transparent; color: var(--accent); border: 1px solid var(--accent); margin-top: 10px; }');
    content = content.replace(/\.btn-outline:hover\s*\{[^}]+\}/g, '.btn-outline:hover { background: var(--overlay-light); }');
    
    // 8. Box Shadows
    // Remove the previous neo-brutal violet glow
    content = content.replace(/box-shadow:\s*0\s*0\s*40px\s*rgba\(94,\s*106,\s*210,\s*0\.05\);/g, '');
    content = content.replace(/box-shadow:\s*inset\s*0\s*0\s*30px\s*rgba\(94,\s*106,\s*210,\s*0\.03\);/g, '');

    // .lang-btn / theme-btn make pills
    content = content.replace(/\.lang-btn\s*\{[^}]+\}/g, (match) => {
        return match.replace(/border-radius:\s*6px;/, 'border-radius: 999px;');
    });

    // AI specific: .face-shape-card
    content = content.replace(/\.face-shape-card\s*\{[^}]+\}/g, '.face-shape-card { background: radial-gradient(circle at center, var(--overlay-mid), transparent 70%); border: 2px solid var(--accent); box-shadow: 0 0 40px var(--overlay-heavy); border-radius: 100%; width: 250px; height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 30px; text-align: center; }');
    // AI font resize inside the card
    content = content.replace(/\.shape-emoji \{ font-size:\s*4rem;/g, '.shape-emoji { font-size: 3rem;');

    // Admin Tabs pill
    content = content.replace(/\.tab\s*\{[^}]+\}/g, '.tab { padding: 10px 20px; cursor: pointer; color: var(--text-muted); border-radius: 999px; border: 1px solid transparent; font-weight: 500; font-family: var(--font-sans); }');
    content = content.replace(/\.tab\.active\s*\{[^}]+\}/g, '.tab.active { color: var(--bg-dark); background: var(--accent); border-color: var(--accent); }');

    // Make the body layout responsive
    fs.writeFileSync(filepath, content);
}

const files = [
    'c:/Users/user/Desktop/baber123123/index.html',
    'c:/Users/user/Desktop/baber123123/ai_style.html',
    'c:/Users/user/Desktop/baber123123/admin.html'
];
files.forEach(processFile);
console.log("Lumina redesign executed!");
