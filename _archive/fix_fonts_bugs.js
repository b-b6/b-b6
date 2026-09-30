const fs = require('fs');

function processFile(filepath) {
    if (!fs.existsSync(filepath)) return;
    let content = fs.readFileSync(filepath, 'utf8');

    // 1. CHANGE FONTS TO UNUSUAL ONES (Russo One & Jura)
    content = content.replace(
        /<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Plus\+Jakarta\+Sans[^"]+" rel="stylesheet">/g,
        '<link href="https://fonts.googleapis.com/css2?family=Jura:wght@400;500;600;700&family=Russo+One&display=swap" rel="stylesheet">'
    );
    
    // Update css root variables for fonts
    content = content.replace(/--font-sans:\s*'[^']+',\s*sans-serif;/g, "--font-sans: 'Jura', sans-serif;");
    content = content.replace(/--font-serif:\s*'[^']+',\s*sans-serif;/g, "--font-serif: 'Russo One', sans-serif;");

    // 2. FIX LIGHT/DARK MODE BUGS (Hardcoded RGBAs)
    
    // Add new overlay variables to :root
    if (!content.includes('--overlay-light:')) {
        content = content.replace(/--transition:/g, "--overlay-light: rgba(255,255,255,0.05); --overlay-heavy: rgba(0,0,0,0.5); --overlay-mid: rgba(0,0,0,0.2); --header-grad: rgba(20,20,24,1); --transition:");
    }
    
    // Add new overlay variables to [data-theme="light"]
    if (content.includes('[data-theme="light"]') && !content.includes('--overlay-light: rgba(0,0,0,0.05)')) {
        content = content.replace(/--border:\s*rgba[^;]+;/g, "--border: rgba(79, 70, 229, 0.2); --overlay-light: rgba(0,0,0,0.04); --overlay-heavy: rgba(255,255,255,0.8); --overlay-mid: rgba(255,255,255,0.5); --header-grad: #f8fafc;");
    }

    // Replace hardcoded RGBA values with variables
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.05\)/g, 'var(--overlay-light)');
    content = content.replace(/rgba\(255,255,255,0\.05\)/g, 'var(--overlay-light)');
    
    content = content.replace(/rgba\(0,\s*0,\s*0,\s*0\.5\)/g, 'var(--overlay-heavy)');
    content = content.replace(/rgba\(0,0,0,0\.5\)/g, 'var(--overlay-heavy)');
    
    content = content.replace(/rgba\(0,\s*0,\s*0,\s*0\.2\)/g, 'var(--overlay-mid)');
    content = content.replace(/rgba\(0,0,0,0\.2\)/g, 'var(--overlay-mid)');

    // Fix index.html header gradient
    content = content.replace(/linear-gradient\(180deg,\s*rgba\(20,20,24,1\)\s*0%,\s*rgba\(10,10,12,0\)\s*100%\)/g, 'linear-gradient(180deg, var(--header-grad) 0%, transparent 100%)');

    // Make sure font-sans is applied cleanly as fallback
    content = content.replace(/font-family: inherit;/g, 'font-family: var(--font-sans);');
    
    // Also, buttons and `.btn` might not look right with Russo One, so we explicitly use font-sans for buttons
    content = content.replace(/font-family: var\(--font-sans\);\s*font-size:\s*1\.1rem;\s*font-weight:\s*600/g, 'font-family: var(--font-serif); font-size: 1.1rem; font-weight: 500');
    // .btn class font family change:
    content = content.replace(/\.btn \{([^}]+)font-family:\s*var\(--font-sans\);/g, '.btn {$1font-family: var(--font-serif);');
    // If it was inherit:
    content = content.replace(/\.btn \{([^}]+)font-family:\s*inherit;/g, '.btn {$1font-family: var(--font-serif);');

    // Let's also fix admin text colors that were black hardcoded
    content = content.replace(/color:\s*#fff/g, 'color: var(--text-main)');
    content = content.replace(/color:#fff/g, 'color:var(--text-main)');
    content = content.replace(/color:\s*#000/g, 'color: var(--bg-dark)');

    fs.writeFileSync(filepath, content);
}

const files = [
    'c:/Users/user/Desktop/baber123123/index.html',
    'c:/Users/user/Desktop/baber123123/ai_style.html',
    'c:/Users/user/Desktop/baber123123/admin.html'
];
files.forEach(processFile);
console.log("Bugfixes and new fonts applied!");
