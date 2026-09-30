const fs = require('fs');

function processFile(filepath) {
    if (!fs.existsSync(filepath)) return;
    let content = fs.readFileSync(filepath, 'utf8');

    // Fix `-webkit- border-radius`
    content = content.replace(/-webkit-\s*border-radius:/g, 'border-radius:');
    
    // Fix corrupted keyframes popIn
    // The current state might be: `@keyframes popIn { ... } to { ... } }`
    // We will replace anything from `@keyframes popIn` up to the mismatched `} }` or `to { ... } }` with the correct pure `@keyframes popIn` block
    
    // Simplest way is to just read and replace the exact corrupted string if possible, or use a broad regex
    content = content.replace(/@keyframes popIn[\s\S]*?to\s*\{[^}]+\}\s*\}\s*\}/g, 
        '@keyframes popIn { 0% { opacity: 0; transform: scale(0.9) translateY(15px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }');
        
    // Wait, the corrupted string matches:
    // `@keyframes popIn { 0% { opacity: 0; transform: scale(0.9) translateY(15px); } 100% { opacity: 1; transform: scale(1) translateY(0); } } to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); } }`
    content = content.replace(/@keyframes popIn \{ 0% \{ opacity: 0; transform: scale\(0\.9\) translateY\(15px\); \} 100% \{ opacity: 1; transform: scale\(1\) translateY\(0\); \} \} to \{ opacity: 1; transform: scale\(1\) translateY\(0\); filter: blur\(0\); \} \}/g, 
        '@keyframes popIn { 0% { opacity: 0; transform: scale(0.9) translateY(15px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }');

    // Also let's tighten the text selection colors
    const selectionCSS = "\n        ::selection { background: var(--accent); color: var(--bg-dark); }\n        ::-moz-selection { background: var(--accent); color: var(--bg-dark); }\n";
    if (!content.includes('::selection')) {
        content = content.replace('body {', selectionCSS + '        body {');
    }

    fs.writeFileSync(filepath, content);
}

const files = [
    'c:/Users/user/Desktop/baber123123/index.html',
    'c:/Users/user/Desktop/baber123123/ai_style.html',
    'c:/Users/user/Desktop/baber123123/admin.html'
];
files.forEach(processFile);
