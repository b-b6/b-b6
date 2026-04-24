import os
import re

def process_file(filepath):
    print(f"Processing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Fonts
    content = re.sub(
        r'<link href=\"https://fonts\.googleapis\.com/css2\?family=Outfit.*?rel=\"stylesheet\">',
        '<link href=\"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap\" rel=\"stylesheet\">',
        content
    )

    # 2. Update CSS Variables
    new_vars = ":root { --bg-dark: #030305; --surface: #101014; --surface-hover: #16161d; --accent: #5e6ad2; --accent-hover: #7b86e8; --text-main: #f4f4f5; --text-muted: #a1a1aa; --border: rgba(94, 106, 210, 0.2); --danger: #ef4444; --success: #10b981; --font-sans: 'Plus Jakarta Sans', sans-serif; --font-serif: 'Syne', sans-serif; --transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }"
    content = re.sub(
        r':root\s*\{[^}]+\}',
        new_vars,
        content
    )

    # 3. Rename generic color variables used in CSS/HTML
    content = content.replace('var(--gold)', 'var(--accent)')
    content = content.replace('var(--gold-hover)', 'var(--accent-hover)')
    
    # 4. Replace hardcoded Colors
    content = content.replace('#C5A880', '#5e6ad2')
    content = content.replace('#D4AF37', '#5e6ad2')
    content = content.replace('#0B0C10', '#030305')
    content = content.replace('rgba(197, 168, 128', 'rgba(94, 106, 210')
    content = content.replace('rgba(212,175,55', 'rgba(94, 106, 210')
    content = content.replace('rgba(212, 175, 55', 'rgba(94, 106, 210')

    # 5. Fix class name semantic updates
    content = content.replace('gold-text', 'accent-text')

    # 6. Change Animations (Elastic PopIn instead of revealLuxury)
    content = re.sub(
        r'@keyframes revealLuxury.*?\}',
        '@keyframes popIn { 0% { opacity: 0; transform: scale(0.9) translateY(15px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }',
        content,
        flags=re.DOTALL
    )
    content = content.replace('revealLuxury', 'popIn')

    # 7. Layout tweaks for Avant-Garde (sharp, brutalist)
    content = re.sub(r'backdrop-filter:\s*blur\([^)]+\);', '', content)
    content = re.sub(r'-webkit-backdrop-filter:\s*blur\([^)]+\);', '', content)
    
    # Rounded corners -> Sharper tech corners
    content = content.replace('border-radius: 20px;', 'border-radius: 8px;')
    content = content.replace('border-radius: 24px;', 'border-radius: 10px;')
    content = content.replace('border-radius: 12px;', 'border-radius: 6px;')
    content = content.replace('border-radius: 16px;', 'border-radius: 8px;')

    # Add neon box-shadows to primary cards dynamically instead of blur
    content = content.replace(
        'border: 1px solid var(--border); padding: 30px;',
        'border: 1px solid var(--border); padding: 30px; box-shadow: 0 0 40px rgba(94, 106, 210, 0.05);'
    )
    
    content = content.replace(
        'background: var(--surface); border: 2px dashed var(--border);',
        'background: var(--surface); border: 2px dashed var(--border); box-shadow: inset 0 0 30px rgba(94, 106, 210, 0.03);'
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

files = [
    'c:/Users/user/Desktop/baber123123/index.html',
    'c:/Users/user/Desktop/baber123123/ai_style.html',
    'c:/Users/user/Desktop/baber123123/admin.html'
]

for file in files:
    if os.path.exists(file):
        process_file(file)
    else:
        print(f"File not found: {file}")
print("Done!")
