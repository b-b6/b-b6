const fs = require('fs');

const lightVars = `
        [data-theme="light"] {
            --bg-dark: #f8fafc;
            --surface: #ffffff;
            --surface-hover: #f1f5f9;
            --accent: #4f46e5;
            --accent-hover: #4338ca;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border: rgba(79, 70, 229, 0.2);
        }
`;

const themeScript = `
    <script>
        (function() {
            const t = localStorage.getItem('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', t);
        })();
        function toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme');
            const target = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', target);
            localStorage.setItem('theme', target);
            updateThemeIcon();
        }
        function updateThemeIcon() {
            const current = document.documentElement.getAttribute('data-theme');
            const icon = document.getElementById('theme-icon');
            if (icon) {
                icon.setAttribute('data-lucide', current === 'light' ? 'moon' : 'sun');
                if (window.lucide) lucide.createIcons();
            }
        }
        document.addEventListener('DOMContentLoaded', updateThemeIcon);
    </script>
`;

function processFile(filepath, type) {
    if (!fs.existsSync(filepath)) return;
    let content = fs.readFileSync(filepath, 'utf8');

    // Add Light Variables
    if (!content.includes('[data-theme="light"]')) {
        content = content.replace('</style>', lightVars + '    </style>');
    }

    // Add Theme Script in head
    if (!content.includes('toggleTheme()')) {
        content = content.replace('</head>', themeScript + '</head>');
    }

    // Add toggle button depending on file
    const themeBtnConfig = {
        'index': '<button class="theme-btn" onclick="toggleTheme()" style="position: absolute; top:15px; left:20px; z-index:100; background: var(--surface); color: var(--text-main); border: 1px solid var(--border); padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: var(--transition); display:flex; align-items:center; gap:6px;"><i data-lucide="sun" id="theme-icon" style="width:18px;height:18px;"></i></button>',
        'ai': '<button class="theme-btn" onclick="toggleTheme()" style="position: absolute; top: 15px; right: 20px; z-index:100; background: var(--surface); color: var(--text-main); border: 1px solid var(--border); padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: var(--transition); display:flex; align-items:center; gap:6px;"><i data-lucide="sun" id="theme-icon" style="width:18px;height:18px;"></i></button>',
        'admin': '<button onclick="toggleTheme()" style="background: transparent; color: var(--text-main); border: 1px solid var(--border); padding: 6px 10px; border-radius: 6px; cursor: pointer; display:inline-flex; align-items:center; transition: var(--transition);"><i data-lucide="sun" id="theme-icon" style="width:18px;height:18px;"></i></button>'
    };

    if (type === 'index' && !content.includes('id="theme-icon"')) {
        content = content.replace('<div class="lang-switcher">', themeBtnConfig['index'] + '\\n    <div class="lang-switcher">');
    }
    if (type === 'ai' && !content.includes('id="theme-icon"')) {
        content = content.replace('<a href="index.html" class="back-link">', themeBtnConfig['ai'] + '\\n    <a href="index.html" class="back-link">');
    }
    if (type === 'admin' && !content.includes('id="theme-icon"')) {
        content = content.replace('<div style="display: flex; gap: 15px; align-items: center;">', '<div style="display: flex; gap: 15px; align-items: center;">\\n            ' + themeBtnConfig['admin']);
    }

    fs.writeFileSync(filepath, content);
}

processFile('c:/Users/user/Desktop/baber123123/index.html', 'index');
processFile('c:/Users/user/Desktop/baber123123/ai_style.html', 'ai');
processFile('c:/Users/user/Desktop/baber123123/admin.html', 'admin');
console.log("Dark mode integrated");
