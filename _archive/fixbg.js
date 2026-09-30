const fs = require('fs');

const cssToReplace = `
        .bg-layer {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: -1;
            background-size: cover;
            background-position: center;
            opacity: 0.15;
            mix-blend-mode: screen;
            pointer-events: none;
            animation: majesticFloat 25s ease-in-out infinite alternate;
        }`;

const newCSS = `
        .bg-layer {
            position: fixed;
            top: 50%;
            left: 50%;
            width: 100vw;
            height: 100vh;
            z-index: -1;
            background-size: contain;
            background-position: top center;
            background-repeat: no-repeat;
            opacity: 0.45; /* Brighter */
            mix-blend-mode: lighten;
            pointer-events: none;
            -webkit-mask-image: radial-gradient(circle at center, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 65%);
            mask-image: radial-gradient(circle at center, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 65%);
            animation: majesticFloat 25s ease-in-out infinite alternate;
        }`;

const keyframesOld = `@keyframes majesticFloat {
            0% { transform: scale(1.05) translate(0px, 0px) rotate(0deg); }
            50% { transform: scale(1.1) translate(15px, -10px) rotate(1deg); filter: brightness(1.2); }
            100% { transform: scale(1.15) translate(-15px, 15px) rotate(-1deg); filter: brightness(0.9); }
        }`;

const keyframesNew = `@keyframes majesticFloat {
            0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
            50% { transform: translate(-52%, -48%) scale(1.04) rotate(1deg); filter: brightness(1.4); }
            100% { transform: translate(-48%, -52%) scale(1.08) rotate(-1deg); filter: brightness(0.9); }
        }`;

function fixBg(file) {
    if (!fs.existsSync(file)) return;
    let c = fs.readFileSync(file, 'utf8');
    
    // Fix text literal \n bugs injected by my previous script
    c = c.replace(/\\n\s*<div class="bg-layer"/g, '<div class="bg-layer"');
    c = c.replace(/\\n\s*<div class="lang-switcher">/g, '\n    <div class="lang-switcher">');
    c = c.replace(/<\/button>\\n/g, '<\/button>\n');
    
    // Find absolute hardcoded '\\n' and remove it
    c = c.replace(/\\n/g, ''); 

    // Replace CSS
    c = c.replace(cssToReplace, newCSS);
    c = c.replace(keyframesOld, keyframesNew);

    fs.writeFileSync(file, c);
}

fixBg('c:/Users/user/Desktop/baber123123/index.html');
fixBg('c:/Users/user/Desktop/baber123123/ai_style.html');
console.log("Background fixed");
