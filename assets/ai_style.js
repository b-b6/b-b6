const i18n = {
            ru: {
                nav_back: "← На сайт записи", hero_title: "Подбор стрижки по лицу", hero_desc: "Загрузите своё фото — нейросеть определит форму вашего лица и подберёт идеальные стрижки специально для вас.", btn_catalog: "Посмотреть наш каталог идей",
                how_1_title: "Сфотографируйтесь", how_1_desc: "Фас, хорошее освещение", how_2_title: "ИИ анализирует", how_2_desc: "Определяет форму лица за секунды", how_3_title: "Ваши стрижки", how_3_desc: "4 идеальных варианта с объяснением",
                upload_title: "Загрузите своё фото", upload_desc: "Нажмите сюда или перетащите файл<br><span style='font-size:0.8rem;opacity:0.6'>JPG, PNG — фас, хорошее освещение</span>",
                btn_analyze: "Подобрать стрижку с помощью ИИ", loading_text: "ИИ анализирует форму вашего лица", loading_sub: "Обычно 5-10 секунд",
                rec_title_1: "Идеальные стрижки", rec_title_2: "для вас", master_tip: "Совет мастера:", cta_title: "Готовы к новому образу?",
                cta_desc: "Запишитесь — мастера воплотят вашу идеальную стрижку", btn_book_now: "Записаться онлайн", btn_retry: "Другое фото",
                match_text: "Подходит на", find_master: "Записаться к мастеру", face_shape_suffix: ""
            },
            en: {
                nav_back: "← Back to booking", hero_title: "AI Haircut Matcher", hero_desc: "Upload a photo — our AI will find your face shape and pick ideal haircuts just for you.", btn_catalog: "View style catalog",
                how_1_title: "Take a photo", how_1_desc: "Front face, good light", how_2_title: "AI Analyzes", how_2_desc: "Finds your face shape in seconds", how_3_title: "Your styles", how_3_desc: "4 ideal options with explanation",
                upload_title: "Upload your photo", upload_desc: "Click here or drag a file<br><span style='font-size:0.8rem;opacity:0.6'>JPG, PNG — front face, good light</span>",
                btn_analyze: "Find a haircut using AI", loading_text: "AI is analyzing your face shape", loading_sub: "Usually 5-10 seconds",
                rec_title_1: "Ideal haircuts", rec_title_2: "for you", master_tip: "Master's tip:", cta_title: "Ready for a new look?",
                cta_desc: "Book an appointment — our masters will bring your ideal haircut to life", btn_book_now: "Book online", btn_retry: "Another photo",
                match_text: "Match", find_master: "Book Master", face_shape_suffix: ""
            },
            uz: {
                nav_back: "← Yozilish saytiga", hero_title: "Face shape orqali soch turmagi", hero_desc: "Rasmingizni yuklang — AI yuzingiz shaklini aniqlab, sizga eng mos soch turmaklarini tanlaydi.", btn_catalog: "Katalogimizni ko'rish",
                how_1_title: "Rasmga tushing", how_1_desc: "To'liq yuz, yaxshi yorug'lik", how_2_title: "AI Tahlil qiladi", how_2_desc: "Yuz shaklini soniyalarda topadi", how_3_title: "Sizning turmaklar", how_3_desc: "Tushuntirish bilan 4ta ideal variant",
                upload_title: "Rasmingizni yuklang", upload_desc: "Bu yerga bosing yoki faylni torting<br><span style='font-size:0.8rem;opacity:0.6'>JPG, PNG — to'liq yuz, yaxshi yorug'lik</span>",
                btn_analyze: "AI yordamida soch turmagi tanlash", loading_text: "AI yuzingizni tahlil qilyapti", loading_sub: "Odatda 5-10 soniya",
                rec_title_1: "Siz uchun", rec_title_2: "ideal soch turmaklari", master_tip: "Ustaning maslahati:", cta_title: "Yangi obrazga tayyormisiz?",
                cta_desc: "Yoziling — ustalarimiz ideal soch turmagingizni yaratadilar", btn_book_now: "Onlayn yozilish", btn_retry: "Boshqa rasm",
                match_text: "Moslik", find_master: "Ustaga yozilish", face_shape_suffix: ""
            },
            kg: {
                nav_back: "← Башкы бетке", hero_title: "ЖИ аркылуу чач кыркуу", hero_desc: "Сүрөтүңүздү жүктөңүз — ЖИ жүзүңүздүн формасын аныктап, сизге идеалдуу чач кыркууларды тандайт.", btn_catalog: "Биздин каталог",
                how_1_title: "Сүрөткө түшүңүз", how_1_desc: "Толук бет, жакшы жарык", how_2_title: "ЖИ Анализдейт", how_2_desc: "Форманы секундда табат", how_3_title: "Кыркуулар", how_3_desc: "4 идеалдуу вариант",
                upload_title: "Сүрөтүңүздү жүктөңүз", upload_desc: "Бул жерди басыңыз же файлды сүйрөңүз<br><span style='font-size:0.8rem;opacity:0.6'>JPG, PNG — толук бет, жакшы жарык</span>",
                btn_analyze: "ЖИ менен чач кыркууну тандоо", loading_text: "ЖИ жүзүңүздү анализдеп жатат", loading_sub: "Адатта 5-10 секунд",
                rec_title_1: "Сиз үчүн", rec_title_2: "идеалдуу чач кыркуулар", master_tip: "Чебердин кеңеши:", cta_title: "Жаңы образга даярсызбы?",
                cta_desc: "Жазылыңыз — биздин чеберлер идеалдуу чач кыркууңузду жасап беришет", btn_book_now: "Онлайн жазылуу", btn_retry: "Башка сүрөт",
                match_text: "Туура келет", find_master: "Чеберге жазылуу", face_shape_suffix: ""
            }
        };

        let currentLang = localStorage.getItem('barber_lang') || 'ru';

        function changeLanguage(lang) {
            currentLang = lang; localStorage.setItem('barber_lang', lang); document.getElementById('lang-select').value = lang;
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (i18n[lang] && i18n[lang][key]) el.innerHTML = i18n[lang][key];
            });
            if (currentFaceData) { renderResults(currentFaceData); } // Re-render if language changed but face is already processed.
        }

        window.addEventListener('DOMContentLoaded', async () => {
            changeLanguage(currentLang);
            lucide.createIcons();
            
            // Preload AI key from Firebase global settings
            if (window.appDB && window.appDB.getGlobalSettings) {
                try {
                    await window.appDB.initPromise;
                    const gSet = await window.appDB.getGlobalSettings();
                    if (gSet.aiKey) {
                        localStorage.setItem('openrouter_api_key', gSet.aiKey);
                        localStorage.setItem('chatbot_api_key', gSet.aiKey);
                        console.log('✅ AI key loaded from Firebase');
                    }
                } catch(e) { console.warn('Could not preload AI key', e); }
            }
        });

        function handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                const img = document.getElementById('preview-img');
                img.src = dataUrl;
                img.style.display = 'block';
                const zone = document.getElementById('upload-zone');
                zone.classList.add('has-image');
                zone.querySelector('.upload-icon').style.display = 'none';
                zone.querySelector('h3').style.display = 'none';
                zone.querySelector('p').style.display = 'none';

                const tempImg = new Image();
                tempImg.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxSize = 1024;
                    let w = tempImg.width, h = tempImg.height;
                    if (w > maxSize || h > maxSize) {
                        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
                        else { w = Math.round(w * maxSize / h); h = maxSize; }
                    }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(tempImg, 0, 0, w, h);
                    const compressed = canvas.toDataURL('image/jpeg', 0.9);
                    selectedImageBase64 = compressed.split(',')[1];
                    document.getElementById('analyze-btn').disabled = false;
                };
                tempImg.src = dataUrl;
                hideError();
            };
            reader.readAsDataURL(file);
        }

        async function analyzePhoto() {
            let userKey = localStorage.getItem('openrouter_api_key');
            let fallbackKeys = [
                atob('c2stb3ItdjEtNTIyMTRjYWExYzlhOTllZWNhNDBhYWU1NTk3ODRiYzI2NjEwZmQ4YmFhMmRkN2UxZjUyNzFjMmU3MjhiNTc5ZQ=='),
                atob('c2stb3ItdjEtYzU2MzJlZTk4MTBhZGY2Zjg4YjRiM2U2NTMwNjYxOTg2N2M3OWU1YzZmZTc1ZDYyMzcyYmVhZGJjMmRmMjg4MA==')
            ];

            if (window.appDB && window.appDB.getGlobalSettings) {
                try {
                    const gSet = await window.appDB.getGlobalSettings();
                    if (gSet && gSet.aiKey) {
                        fallbackKeys.unshift(gSet.aiKey);
                    }
                } catch(e) { console.warn('Could not load AI key from Firebase', e); }
            }

            let keysToTry = [];
            if (userKey) keysToTry.push(userKey);
            fallbackKeys.forEach(k => { if (!keysToTry.includes(k)) keysToTry.push(k); });
            if (!selectedImageBase64) { showError('Загрузите фото!'); return; }

            hideError();
            document.getElementById('loading-state').style.display = 'block';
            document.getElementById('analyze-btn').disabled = true;
            document.getElementById('result-section').style.display = '';
            document.getElementById('result-section').classList.remove('active');

            const prompt = `You are the world's leading barber stylist and face morphology expert. 
Your task is to analyze the user's photo and pick 4 perfect hairstyles.
Current language for response: ${currentLang.toUpperCase()}.

IMPORTANT: 
- Respond STICTLY in ${currentLang === 'ru' ? 'Russian' : currentLang === 'en' ? 'English' : currentLang === 'uz' ? 'Uzbek' : 'Kyrgyz'} language.
- Format the response as a JSON object.

STEP 1: MORPHOLOGY ANALYSIS
1. Face Shape: Oval, Square, Round, Triangle, Heart, Diamond, or Oblong.
2. Features: Jawline sharpness, forehead height, cheekbone width.
3. Hair: Texture, density, current length.

STEP 2: STYLE SELECTION (Choose best from catalog):
- SHORT: Buzz Cut, Crew Cut, High Fade, Caesar, French Crop, Spiky Textured, Side Part Fade, Ivy League.
- MEDIUM / LONG: Messy Waves, Layered Shag, Modern Pompadour, Bro Flow, Curtains (Middle Part), Wolf Cut, Modern Mullet, Two-Block Cut.

STEP 3: EXPERT JUSTIFICATION
For each style, explain why it fits specifically based on their features.

JSON FORMAT:
{
  "faceShape": "Shape Name in ${currentLang}",
  "faceDescription": "Professional analysis in ${currentLang} (5-7 sentences).",
  "styles": [
    {"name": "Style Name", "description": "Why it fits in ${currentLang}", "matchPercent": 95},
    ...
  ],
  "masterTip": "Styling advice in ${currentLang}."
}`;

            const models = [
                'google/gemini-2.0-flash-exp:free',
                'meta-llama/llama-3.2-11b-vision-instruct:free',
                'qwen/qwen-2-vl-72b-instruct:free',
                'liquid/lfm-2.5-embedding-350m:free',
                'google/gemini-2.0-flash-001',
                'openai/gpt-4o-mini'
            ];

            for (let apiKey of keysToTry) {
                for (let model of models) {
                    try {
                        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json',
                                'HTTP-Referer': window.location.origin || 'https://barber.uz',
                                'X-Title': 'Barbershop AI'
                            },
                            body: JSON.stringify({
                                model: model,
                                messages: [{
                                    role: 'user',
                                    content: [
                                        { type: 'text', text: prompt },
                                        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${selectedImageBase64}` } }
                                    ]
                                }],
                                max_tokens: 1500,
                                temperature: 0.1
                            })
                        });

                        const data = await resp.json();
                        if (!resp.ok) {
                            lastAnalysisError = data.error?.message || 'Ошибка API';
                            if (resp.status === 401 || lastAnalysisError.includes('User not found')) {
                                localStorage.removeItem('openrouter_api_key');
                                break; // Key is invalid; try next key in keysToTry
                            }
                            continue; // Try next model
                        }

                        // Success! Store working key
                        localStorage.setItem('openrouter_api_key', apiKey);
                        let rawText = data.choices[0].message.content;
                        rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                        const result = JSON.parse(rawText);
                        renderResults(result);
                        return;
                    } catch (e) {
                        lastAnalysisError = e.message;
                        continue;
                    }
                }
            }

            document.getElementById('loading-state').style.display = 'none';
            document.getElementById('analyze-btn').disabled = false;

            if (lastAnalysisError.includes('User not found') || lastAnalysisError.includes('401') || lastAnalysisError.includes('Key')) {
                localStorage.removeItem('openrouter_api_key');
                let freshKey = window.prompt('Ключ OpenRouter был аннулирован.\nВставьте новый бесплатный ключ с https://openrouter.ai/keys :');
                if (freshKey && freshKey.trim()) {
                    localStorage.setItem('openrouter_api_key', freshKey.trim());
                    return analyzePhoto();
                }
            }

            showError('Ошибка анализа: ' + lastAnalysisError);
        }

        const FACE_ICONS = {
            'oval': 'circle',
            'овал': 'circle',
            'round': 'disc',
            'круг': 'disc',
            'square': 'square',
            'квадрат': 'square',
            'oblong': 'rectangle-vertical',
            'прямоугольн': 'rectangle-vertical',
            'heart': 'heart',
            'сердц': 'heart',
            'triangle': 'triangle',
            'треугольн': 'triangle',
            'diamond': 'gem',
            'ромб': 'gem'
        };

        const STYLE_ICONS = ['scissors', 'sparkles', 'user-check', 'award'];

        const FACE_SHAPE_NAMES = {
            en: { 'овал': 'Oval Face', 'овальная': 'Oval Face', 'круг': 'Round Face', 'круглая': 'Round Face', 'квадрат': 'Square Face', 'квадратная': 'Square Face', 'прямоугольн': 'Oblong Face', 'прямоугольная': 'Oblong Face', 'сердц': 'Heart Face', 'сердцевидная': 'Heart Face', 'треугольн': 'Triangle Face', 'треугольная': 'Triangle Face', 'ромб': 'Diamond Face', 'ромбовидная': 'Diamond Face' },
            ru: { 'oval': 'Овальная форма', 'round': 'Круглая форма', 'square': 'Квадратная форма', 'oblong': 'Прямоугольная форма', 'heart': 'Сердцевидная форма', 'triangle': 'Треугольная форма', 'diamond': 'Ромбовидная форма' },
            uz: { 'oval': 'Oval yuz shakli', 'round': 'Dumaloq yuz', 'square': 'Kvadrat yuz', 'oblong': 'To\'rtburchak yuz', 'heart': 'Yuraksimon yuz', 'triangle': 'Uchburchak yuz', 'diamond': 'Romb yuz' },
            kg: { 'oval': 'Овал жүз', 'round': 'Тегерек жүз', 'square': 'Квадрат жүз', 'oblong': 'Төрт бурчтук жүз' }
        };

        function renderResults(data) {
            document.getElementById('loading-state').style.display = 'none';
            currentFaceData = data;

            let fl = (data.faceShape || '').toLowerCase();
            let iconName = 'scan-face';
            for (let k in FACE_ICONS) { if (fl.includes(k)) { iconName = FACE_ICONS[k]; break; } }

            let displayShape = data.faceShape;
            if (FACE_SHAPE_NAMES[currentLang]) {
                for (let k in FACE_SHAPE_NAMES[currentLang]) {
                    if (fl.includes(k)) { displayShape = FACE_SHAPE_NAMES[currentLang][k]; break; }
                }
            }

            document.getElementById('result-emoji').innerHTML = `<i data-lucide="${iconName}" style="width:64px;height:64px;stroke-width:1;"></i>`;
            document.getElementById('result-face-type').innerText = displayShape;
            document.getElementById('result-face-desc').innerText = data.faceDescription;

            const grid = document.getElementById('style-grid');
            grid.innerHTML = '';
            const matchText = i18n[currentLang].match_text || 'Match';
            const findMasterText = i18n[currentLang].find_master || 'Book Master';

            (data.styles || []).forEach((s, i) => {
                const card = document.createElement('div');
                card.className = 'style-card';
                card.innerHTML = `
                    <div class="style-icon" style="color:var(--accent);"><i data-lucide="${STYLE_ICONS[i] || 'scissors'}" style="width:32px;height:32px;"></i></div>
                    <h4>${s.name}</h4>
                    <p>${s.description}</p>
                    <span class="match-badge">✓ ${matchText} ${s.matchPercent}%</span>
                    <a href="index.html" class="btn-book" style="display:flex; align-items:center; justify-content:center; gap:8px; margin-top:15px; padding: 10px; font-size: 0.9rem; background: var(--surface-hover); color: var(--accent); border: 1px solid var(--accent);"><i data-lucide="scissors" style="width:16px;"></i> ${findMasterText}</a>
                `;
                grid.appendChild(card);
            });

            document.getElementById('tip-text').innerText = data.masterTip;
            document.getElementById('result-section').classList.add('active');
            lucide.createIcons();
            document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
        }

        function resetAnalysis() {
            selectedImageBase64 = null;
            document.getElementById('preview-img').style.display = 'none';
            document.getElementById('upload-zone').classList.remove('has-image');
            document.querySelectorAll('#upload-zone .upload-icon, #upload-zone h3, #upload-zone p').forEach(el => el.style.display = 'block');
            document.getElementById('file-input').value = '';
            document.getElementById('analyze-btn').disabled = true;
            document.getElementById('result-section').classList.remove('active');
            hideError();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function openCatalog() { document.getElementById('catalog-modal').style.display = 'flex'; }
        function closeCatalog() { document.getElementById('catalog-modal').style.display = 'none'; }
        function showError(msg) { document.getElementById('error-text').innerText = msg; document.getElementById('error-box').style.display = 'block'; }
        function hideError() { document.getElementById('error-box').style.display = 'none'; }
