const fs = require('fs');

const bgCSS = `
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
        }
        [data-theme="light"] .bg-layer {
            mix-blend-mode: multiply;
            opacity: 0.08;
            filter: grayscale(1);
        }
        @keyframes majesticFloat {
            0% { transform: scale(1.05) translate(0px, 0px) rotate(0deg); }
            50% { transform: scale(1.1) translate(15px, -10px) rotate(1deg); filter: brightness(1.2); }
            100% { transform: scale(1.15) translate(-15px, 15px) rotate(-1deg); filter: brightness(0.9); }
        }
`;

function addBg(file, image) {
    if (!fs.existsSync(file)) return;
    let c = fs.readFileSync(file, 'utf8');
    
    if (!c.includes('.bg-layer')) {
        c = c.replace('</style>', bgCSS + '    </style>');
        
        const htmlToInject = `<div class="bg-layer" style="background-image: url('${image}');"></div>\n    `;
        
        if (c.includes('<div class="lang-switcher">')) {
            c = c.replace('<div class="lang-switcher">', htmlToInject + '<div class="lang-switcher">');
        } else if (c.includes('<a href="index.html" class="back-link">')) {
            c = c.replace('<a href="index.html" class="back-link">', htmlToInject + '<a href="index.html" class="back-link">');
        }
        fs.writeFileSync(file, c);
    }
}

addBg('c:/Users/user/Desktop/baber123123/index.html', 'assets/bg_1.jpg');
addBg('c:/Users/user/Desktop/baber123123/ai_style.html', 'assets/bg_2.jpg');
