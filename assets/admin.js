const DB_DISABLED_DATES = 'barber_disabled_dates';

        const defaultServices = [
            { id: 'haircut', price: 1500, duration: 60, strings: { ru: { title: "Мужская стрижка", desc: "Мытье головы, стрижка, укладка" }, en: { title: "Men's Haircut", desc: "Hair wash, haircut, styling" }, uz: { title: "Erkaklar soch turmagi", desc: "Soch yuvish, soch kesish, turmaklash" }, kg: { title: "Эркектердин чач кыркуусу", desc: "Чач жуу, чач кыркуу, жасалгалоо" } } },
            { id: 'beard', price: 1000, duration: 30, strings: { ru: { title: "Оформление бороды", desc: "Распаривание, коррекция формы, масло" }, en: { title: "Beard Styling", desc: "Steaming, shaping, oil" }, uz: { title: "Soqol olish", desc: "Bug'lash, shakl berish, yog'" }, kg: { title: "Сакал коюу", desc: "Буулоо, форма берүү, май" } } }
        ];

        const defaultMasters = [
            { id: 'm1', name: 'Мастер Алексей', share: 50, productShare: 10, workingDays: [1,2,3,4,5,6,0] },
            { id: 'm2', name: 'Мастер Иван', share: 50, productShare: 10, workingDays: [1,2,3,4,5,6,0] }
        ];

        const defaultSettings = { openTime: '10:00', closeTime: '21:00' };
        
        const defaultProducts = [
            { id: 'p1', name: 'Масло для бороды', buyPrice: 300, sellPrice: 1200, count: 10 },
            { id: 'p2', name: 'Матовая пудра', buyPrice: 500, sellPrice: 1500, count: 5 }
        ];

        // Removed local getAdminPin to force Firebase validation

        let currentAdminLang = localStorage.getItem('adminLang') || 'ru';
        const adminI18n = {
            ru: {
                admin_title: '<span class="accent-text">Админ</span> Панель',
                tab_stats: 'Статистика', tab_bookings: 'Записи', tab_masters: 'Мастера', tab_services: 'Услуги и Цены', tab_products: 'Склад (Товары)', tab_clients: 'Клиенты (CRM)', tab_reviews: 'Отзывы', tab_settings: 'Настройки и Время', nav_back: 'На сайт записи',
                auth_desc: 'Введите email и PIN от владельца системы.', auth_btn: 'Войти', auth_error: 'Неверный Email или PIN',
                stat_review: 'Обзор бизнеса', stat_t_count: 'Записей на сегодня', stat_t_rev: 'Примерная выручка за сегодня', stat_total_rev: 'Общая выручка всех времен', stat_total_count: 'Всего записей в базе',
                stat_chart_1: 'Динамика выручки (Последние дни)', stat_chart_2: 'Доля мастеров в выручке (Все время)',
                stat_salaries_title: 'Зарплаты и выручка салона (из завершенных записей)',
                table_master: 'Мастер', table_share: 'Доля (%)', table_rev: 'Общая выручка', table_salary: 'ЗП Мастера', table_net: 'В кассу салона',
                book_grid_title: 'Сетка на сегодня', book_grid_sub: 'Кликните на пустое окно, чтобы быстро записать',
                mast_sub: 'Добавьте ваших барберов, чтобы клиенты могли записываться к конкретному человеку. Здесь же можно указать ссылку на их фото.',
                option_serv_custom: '-- Своя услуга (настроить с нуля) --',
                prod_add_title: 'Добавить новый товар', label_prod_name: 'Название', label_prod_buy: 'Закупка (₽)', label_prod_sell: 'Продажа (₽)', label_prod_count: 'Кол-во (шт)',
                table_prod_name: 'Название', table_prod_buy: 'В закупе (₽)',
                table_client_name: 'Имя клиента', table_client_phone: 'Телефон', table_client_last: 'Крайний визит',
                set_bkp_title: 'Резервное копирование и Бухгалтерия', set_bkp_desc: 'Скачайте всю историю записей в формате CSV (открывается в Excel) себе на ПК.', btn_export: 'Скачать базу записей (.csv)',
                set_shop_title: 'Общие настройки салона (Мой Сайт)', set_shop_link: 'Ссылка на вашу онлайн-запись (отправьте ее клиентам):', label_shop_name: 'Название вашего сайта (Отображается клиентам)', btn_save_shop: 'Сохранить название сайта',
                set_design_title: 'Настройки Дизайна (White-Label)', set_design_desc: 'Кастомизируйте внешний вид вашего сайта.', label_accent: 'Акцентный цвет', label_font: 'Шрифт заголовков', label_bg: 'Фоновое изображение',
                check_ai: 'Отключить рекламный баннер AI подбора', check_stat: 'Скрыть блок живой статистики (Записи сегодня)', btn_save_design: 'Сохранить дизайн',
                set_sec_title: 'Безопасность (Логин и Пароль)', set_sec_desc: 'Измените свой логин (Email) и PIN-код для входа.', btn_change_pin: 'Изменить PIN-код',
                msg_empty_bk: 'Пока нет ни одной записи.', msg_empty_rev: 'Отзывов пока нет', msg_no_data: 'Нет данных'
            },
            en: {
                admin_title: '<span class="accent-text">Admin</span> Panel',
                tab_stats: 'Stats', tab_bookings: 'Bookings', tab_masters: 'Staff', tab_services: 'Services & Prices', tab_products: 'Inventory', tab_clients: 'Clients (CRM)', tab_reviews: 'Reviews', tab_settings: 'Settings & Time', nav_back: 'To Website',
                auth_desc: 'Enter the system owner\'s email and PIN.', auth_btn: 'Login', auth_error: 'Invalid Email or PIN',
                stat_review: 'Business Overview', stat_t_count: 'Appointments today', stat_t_rev: 'Estimated revenue today', stat_total_rev: 'Total revenue all time', stat_total_count: 'Total records in database',
                stat_chart_1: 'Revenue dynamics (Recent days)', stat_chart_2: 'Master revenue share (All time)',
                stat_salaries_title: 'Salaries & salon revenue (from completed bookings)',
                table_master: 'Master', table_share: 'Share (%)', table_rev: 'Total Revenue', table_salary: 'Master Salary', table_net: 'To Salon',
                book_grid_title: "Today's schedule", book_grid_sub: 'Click an empty slot to quickly book',
                mast_sub: 'Add your barbers so clients can book with a specific person.',
                option_serv_custom: '-- Custom service (configure from scratch) --',
                prod_add_title: 'Add new product', label_prod_name: 'Name', label_prod_buy: 'Purchase (₽)', label_prod_sell: 'Sale (₽)', label_prod_count: 'Qty (pcs)',
                table_prod_name: 'Name', table_prod_buy: 'Purchase price (₽)',
                table_client_name: 'Client Name', table_client_phone: 'Phone', table_client_last: 'Last visit',
                set_bkp_title: 'Backup & Accounting', set_bkp_desc: 'Download the entire booking history in CSV format (opens in Excel).', btn_export: 'Download booking database (.csv)',
                set_shop_title: 'General Salon Settings (My Site)', set_shop_link: 'Link to your online booking (send to clients):', label_shop_name: 'Your site name (Shown to clients)', btn_save_shop: 'Save site name',
                set_design_title: 'Design Settings (White-Label)', set_design_desc: 'Customize the appearance of your website.', label_accent: 'Accent color', label_font: 'Heading font', label_bg: 'Background image',
                check_ai: 'Disable AI selection promo banner', check_stat: 'Hide live stats block (Today\'s bookings)', btn_save_design: 'Save design',
                set_sec_title: 'Security (Login & Password)', set_sec_desc: 'Change your login (Email) and PIN code.', btn_change_pin: 'Change PIN',
                msg_empty_bk: 'No bookings yet.', msg_empty_rev: 'No reviews yet', msg_no_data: 'No data'
            },
            uz: {
                admin_title: '<span class="accent-text">Admin</span> Panel',
                tab_stats: 'Statistika', tab_bookings: 'Yozuvlar', tab_masters: 'Ustalar', tab_services: 'Xizmatlar va Narxlar', tab_products: 'Omborxona', tab_clients: 'Mijozlar (CRM)', tab_reviews: 'Sharhlar', tab_settings: 'Sozlamalar va Vaqt', nav_back: 'Saytga',
                auth_desc: 'Tizim egasining email va PIN kodini kiriting.', auth_btn: 'Kirish', auth_error: 'Noto\'g\'ri Email yoki PIN',
                stat_review: 'Biznes ko\'rinishi', stat_t_count: 'Bugungi yozuvlar', stat_t_rev: 'Bugungi taxminiy daromad', stat_total_rev: 'Barcha vaqtdagi umumiy daromad', stat_total_count: 'Bazadagi jami yozuvlar',
                stat_chart_1: 'Daromad dinamikasi (So\'nggi kunlar)', stat_chart_2: 'Ustalar daromad ulushi (Barcha vaqt)',
                stat_salaries_title: 'Maoshlar va salon daromadi (bajarilgan yozuvlardan)',
                table_master: 'Usta', table_share: 'Ulush (%)', table_rev: 'Umumiy daromad', table_salary: 'Usta maoshi', table_net: 'Salonga',
                book_grid_title: 'Bugungi jadval', book_grid_sub: 'Tezda yozish uchun bo\'sh oynani bosing',
                mast_sub: 'Mijozlar muayyan ustaga yozilishi uchun barberlaringizni qo\'shing.',
                option_serv_custom: '-- O\'z xizmat (noldan sozlash) --',
                prod_add_title: 'Yangi tovar qo\'shish', label_prod_name: 'Nomi', label_prod_buy: 'Xarid (₽)', label_prod_sell: 'Sotuv (₽)', label_prod_count: 'Miqdor (dona)',
                table_prod_name: 'Nomi', table_prod_buy: 'Xarid narxi (₽)',
                table_client_name: 'Mijoz ismi', table_client_phone: 'Telefon', table_client_last: 'So\'nggi tashrif',
                set_bkp_title: 'Zaxira nusxa va Buxgalteriya', set_bkp_desc: 'Barcha yozuvlar tarixini CSV formatida yuklab oling (Excelda ochiladi).', btn_export: 'Yozuvlar bazasini yuklab olish (.csv)',
                set_shop_title: 'Umumiy salon sozlamalari (Mening saytim)', set_shop_link: 'Onlayn yozilish havolasi (mijozlarga yuboring):', label_shop_name: 'Saytingiz nomi (Mijozlarga ko\'rinadi)', btn_save_shop: 'Sayt nomini saqlash',
                set_design_title: 'Dizayn sozlamalari (White-Label)', set_design_desc: 'Saytingizning ko\'rinishini moslang.', label_accent: 'Aksent rangi', label_font: 'Sarlavha shrifti', label_bg: 'Fon tasviri',
                check_ai: 'AI tanlovi reklama bannerini o\'chirish', check_stat: 'Jonli statistika blokini yashirish', btn_save_design: 'Dizaynni saqlash',
                set_sec_title: 'Xavfsizlik (Login va Parol)', set_sec_desc: 'Login (Email) va PIN kodingizni o\'zgartiring.', btn_change_pin: 'PIN kodni o\'zgartirish',
                msg_empty_bk: 'Hozircha hech qanday yozuv yo\'q.', msg_empty_rev: 'Hozircha sharhlar yo\'q', msg_no_data: 'Ma\'lumot yo\'q'
            },
            kg: {
                admin_title: '<span class="accent-text">Админ</span> Панель',
                tab_stats: 'Статистика', tab_bookings: 'Жазуулар', tab_masters: 'Усталар', tab_services: 'Кызматтар жана Баалар', tab_products: 'Склад', tab_clients: 'Кардарлар (CRM)', tab_reviews: 'Сын-пикирлер', tab_settings: 'Жөндөөлөр', nav_back: 'Сайтка',
                auth_desc: 'Система ээсинин email жана PIN кодун киргизиңиз.', auth_btn: 'Кирүү', auth_error: 'Туура эмес Email же PIN',
                stat_review: 'Бизнестин жалпы көрүнүшү', stat_t_count: 'Бүгүнкү жазуулар', stat_t_rev: 'Бүгүнкү болжолдуу киреше', stat_total_rev: 'Бардык убакыттагы жалпы киреше', stat_total_count: 'Базадагы жалпы жазуулар',
                stat_chart_1: 'Киреше динамикасы (Акыркы күндөр)', stat_chart_2: 'Усталардын киреше үлүшү (Бардык убакыт)',
                stat_salaries_title: 'Айлыктар жана салон киресеси (аяктаган жазуулардан)',
                table_master: 'Чебер', table_share: 'Үлүш (%)', table_rev: 'Жалпы киреше', table_salary: 'Чебердин айлыгы', table_net: 'Салонго',
                book_grid_title: 'Бүгүнкү график', book_grid_sub: 'Тез жазуу үчүн бош терезеге басыңыз',
                mast_sub: 'Кардарлар белгилүү бир адамга жазыла алуусу үчүн барберлериңизди кошуңуз.',
                option_serv_custom: '-- Өз кызмат (нолдон жөндөө) --',
                prod_add_title: 'Жаңы товар кошуу', label_prod_name: 'Аталышы', label_prod_buy: 'Сатып алуу (₽)', label_prod_sell: 'Сатуу (₽)', label_prod_count: 'Саны (дана)',
                table_prod_name: 'Аталышы', table_prod_buy: 'Сатып алуу баасы (₽)',
                table_client_name: 'Кардардын аты', table_client_phone: 'Телефон', table_client_last: 'Акыркы келүү',
                set_bkp_title: 'Камдык көчүрмө жана Бухгалтерия', set_bkp_desc: 'Бардык жазуулар тарыхын CSV форматында жүктөп алыңыз.', btn_export: 'Жазуулар базасын жүктөп алуу (.csv)',
                set_shop_title: 'Салондун жалпы жөндөөлөрү (Менин сайтым)', set_shop_link: 'Онлайн жазылуу шилтемеси (кардарларга жибериңиз):', label_shop_name: 'Сайтыңыздын аталышы (Кардарларга көрүнөт)', btn_save_shop: 'Сайттын атын сактоо',
                set_design_title: 'Дизайн жөндөөлөрү (White-Label)', set_design_desc: 'Сайтыңыздын дизайнын ыңгайлаштырыңыз.', label_accent: 'Акцент түсү', label_font: 'Аталыш шрифти', label_bg: 'Фон сүрөтү',
                check_ai: 'AI тандоо жарнак баннерин өчүрүү', check_stat: 'Жандуу статистика блогун жашыруу', btn_save_design: 'Дизайнды сактоо',
                set_sec_title: 'Коопсуздук (Логин жана Сырсөз)', set_sec_desc: 'Логин (Email) жана PIN кодуңузду өзгөртүңүз.', btn_change_pin: 'PIN кодду өзгөртүү',
                msg_empty_bk: 'Азырынча жазуулар жок.', msg_empty_rev: 'Азырынча пикирлер жок', msg_no_data: 'Маалымат жок'
            }
        };

        window.changeLanguage = function(lang) {
            currentAdminLang = lang;
            window.currentLang = lang; // For compatibility
            localStorage.setItem('adminLang', lang);
            let sel = document.getElementById('lang-select');
            if(sel) sel.value = lang;
            
            document.querySelectorAll('[data-i18n]').forEach(el => {
                let key = el.getAttribute('data-i18n');
                if(adminI18n[lang] && adminI18n[lang][key]) el.innerHTML = adminI18n[lang][key];
            });

            if(document.getElementById('admin-services-list') && document.getElementById('admin-services-list').innerHTML !== '') {
                renderServicesEditor();
            }
        };

        const store = {
            bookings: [], reviews: [], disabledDates: [],
            services: defaultServices, masters: defaultMasters, settings: defaultSettings, products: defaultProducts
        };

        async function initAdmin() {
            if(sessionStorage.getItem('adminAuth') !== 'true') {
                document.getElementById('auth-overlay').style.display = 'flex';
                return;
            } else {
                document.getElementById('auth-overlay').style.display = 'none';
                let set = await window.appDB.getSettings();
                Object.assign(store.settings, set);
                document.getElementById('header-shop-name').innerText = store.settings.shopName ? `— ${store.settings.shopName}` : `ID: ${window.appDB.tenantId}`;
                let fullPath = window.location.origin + window.location.pathname.replace('admin.html', '') + `index.html?id=${window.appDB.tenantId}`;
                let mbLink = document.getElementById('my-booking-link');
                if(mbLink) { mbLink.href = fullPath; mbLink.innerText = fullPath; }

                if(window.appDB.getGlobalSettings) {
                    let gSet = await window.appDB.getGlobalSettings();
                    if(gSet.aiKey) {
                        localStorage.setItem('openrouter_api_key', gSet.aiKey);
                        localStorage.setItem('chatbot_api_key', gSet.aiKey);
                    }
                }
            }
            fetchAndRender();
        }

        async function checkPin() {
            const email = document.getElementById('email-input').value.trim();
            const pin = document.getElementById('pin-input').value.trim();
            
            const tenants = await window.appDB.getGlobalTenants();
            let t = tenants.find(x => x.email === email && x.pin === pin);
            if (!t && (email === 'admin@barber.uz' || email === 'admin') && pin === '7777') {
                t = { id: 'markazibarbershop1', email: 'admin@barber.uz', pin: '7777', shopName: 'Главный Барбершоп' };
            }
            if (!t && (email === 'shine' || email === 'shine@barber.uz') && pin === '7777') {
                t = { id: 'shine_barbershop', email: 'shine', pin: '7777', shopName: 'Shine Barbershop' };
            }
            if(t) {
                localStorage.setItem('tenant_id', t.id);
                sessionStorage.setItem('adminAuth', 'true');
                location.reload(); // Re-init the app DB correctly!
            } else {
                document.getElementById('pin-error').style.display = 'block';
            }
        }

        async function fetchAndRender() {
            // Real-time db.js hooks
            // Track booking count for notification sound
            let prevBookingCount = store.bookings.length;
            let isFirstLoad = true;
            
            window.appDB.subscribe('barber_bookings', data => { 
                store.bookings = data;
                
                // Play notification sound if new booking arrived (not on first load)
                if (!isFirstLoad && data.length > prevBookingCount && notificationsEnabled) {
                    playNewBookingAlert(data[data.length - 1]);
                }
                prevBookingCount = data.length;
                isFirstLoad = false;
                
                loadAdminData(); 
            });
            window.appDB.subscribe('barber_services', data => { if(data.length) store.services = data; loadAdminData(); });
            window.appDB.subscribe('barber_masters', data => { if(data.length) store.masters = data; loadAdminData(); });
            window.appDB.subscribe('barber_products', data => { if(data.length) store.products = data; loadAdminData(); });
            window.appDB.subscribe('barber_reviews', data => { store.reviews = data; loadAdminData(); });
            
            store.bookings = await window.appDB.getBookings();
            let srv = await window.appDB.getServices(); if(srv.length) store.services = srv;
            let mst = await window.appDB.getMasters(); if(mst.length) store.masters = mst;
            let prd = await window.appDB.getProducts(); if(prd.length) store.products = prd;
            store.reviews = await window.appDB.getReviews();
            
            loadAdminData();
        }

        async function loadAdminData() {
            const bookings = store.bookings;
            const services = store.services;
            const masters = store.masters;
            const products = store.products;
            const reviews = store.reviews;
            
            // Render basic stats
            const list = document.getElementById('admin-bookings-list');
            let sorted = bookings.slice().sort((a,b) => new Date(a.date) - new Date(b.date));

            let today = new Date().toISOString().split('T')[0];
            let tRev = 0, todayRev = 0, todayCnt = 0;

            list.innerHTML = '';
            if(sorted.length === 0) { list.innerHTML = `<div class="empty-state">${adminI18n[currentAdminLang].msg_empty_bk}</div>`; }
            else {
                sorted.forEach(b => {
                    let st = b.status || 'pending';
                    let isCancelled = st === 'cancelled';
                    let isCompleted = st === 'completed';
                    let isProg = st === 'in_progress';
                    let stColor = isCompleted ? '#2ed573' : (isCancelled ? '#ff4757' : (isProg ? '#1e90ff' : '#f1c40f'));
                    
                    if (!isCancelled) {
                        if(b.date === today) todayCnt++; 
                    }
                    if (isCompleted) {
                        tRev += parseInt(b.price || 0);
                        if(b.date === today) todayRev += parseInt(b.price || 0);
                    }
                    
                    list.innerHTML += `<div class="booking-item" style="${isCancelled ? 'opacity: 0.5;' : ''} align-items: stretch; flex-direction: column;"><div style="display: flex; justify-content: space-between; align-items: flex-start;"><div class="booking-details" style="flex: 1;"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 5px;"><h4 style="margin:0;">${b.date} в ${b.time}</h4><select onchange="updateBookingStatus('${b.id}', this.value)" style="background:var(--bg-dark); color:${stColor}; border:1px solid var(--border); padding:4px 8px; border-radius:6px; outline:none; font-size:0.85rem; font-weight:600; cursor:pointer;"><option value="pending" style="color:#f1c40f;" ${st === 'pending' ? 'selected' : ''}>🟡 Ожидается</option><option value="in_progress" style="color:#1e90ff;" ${st === 'in_progress' ? 'selected' : ''}>🔵 В кресле</option><option value="completed" style="color:#2ed573;" ${st === 'completed' ? 'selected' : ''}>🟢 Завершено</option><option value="cancelled" style="color:#ff4757;" ${st === 'cancelled' ? 'selected' : ''}>🔴 Отменено</option></select></div><p><strong style="color: var(--text-main);">КЛИЕНТ:</strong> ${b.name} (${b.phone})</p><p><strong style="color: var(--text-main);">УСЛУГА:</strong> ${b.service} - ${b.price} ₽</p><p><strong style="color: var(--text-main);">МАСТЕР:</strong> ${b.masterName || 'Любой'}</p></div><div style="display: flex; flex-direction: column; justify-content: flex-end; margin-left: 15px; gap: 5px;"><button class="btn-danger" onclick="deleteBooking('${b.id}')">Удалить</button></div></div></div>`;
                });
            }

            let eRev = document.getElementById('stat-total-rev'); if(eRev) eRev.innerText = tRev + ' ₽';
            let eTodRev = document.getElementById('stat-today-rev'); if(eTodRev) eTodRev.innerText = todayRev + ' ₽';
            let eCnt = document.getElementById('stat-today-count'); if(eCnt) eCnt.innerText = todayCnt;
            let eTotClass = document.getElementById('stat-total-count'); if(eTotClass) eTotClass.innerText = bookings.length;

            renderSalaries(bookings, masters);
            renderProductsList(products);
            renderMastersList(masters);
            renderAdminReviews(reviews);
            renderServicesEditor(services);
            renderManualOptions(services, masters);
            renderCalendarGrid(bookings);
            renderCharts(bookings);
            renderClientsTab(bookings);
            lucide.createIcons();
            updateNotifButton();
        }


        document.addEventListener('DOMContentLoaded', initAdmin);

        function switchAdminTab(tabName, element) {
            document.querySelectorAll('.admin-header .tab').forEach(t => t.classList.remove('active'));
            element.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`admin-tab-${tabName}`).classList.add('active');
            if (tabName === 'settings') renderSettingsTab();
        }

        async function changeProductCount(id, delta) {
            let p = store.products.find(x => x.id === id);
            if (p) { p.count = Math.max(0, p.count + delta); await window.appDB.saveProducts(store.products); }
        }

        function toggleProductPanel(panelId) {
            let el = document.getElementById(panelId);
            if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
        }

        async function addProductToBooking(bookingId) {
            let selEl = document.getElementById('prod_sel_' + bookingId);
            if (!selEl) return;
            let prodId = selEl.value;
            let prod = store.products.find(p => p.id === prodId);
            if (!prod) return;
            if (prod.count <= 0) { alert('Товар закончился на складе!'); return; }

            prod.count -= 1;
            await window.appDB.saveProducts(store.products);

            let bIdx = store.bookings.findIndex(b => b.id === bookingId);
            if (bIdx !== -1) {
                if (!store.bookings[bIdx].purchases) store.bookings[bIdx].purchases = [];
                store.bookings[bIdx].purchases.push({ id: prod.id, name: prod.name, sellPrice: prod.sellPrice, buyPrice: prod.buyPrice });
                await window.appDB.saveBookings(store.bookings);
            }
        }

        // SETTINGS & SCHEDULE
        async function renderSettingsTab() {
            let set = await window.appDB.getSettings();
            Object.assign(store.settings, set);
            document.getElementById('set_open').value = set.openTime || '10:00';
            document.getElementById('set_close').value = set.closeTime || '21:00';
            document.getElementById('set_tg_token').value = set.telegram_bot_token || '';
            if(set.telegram_bot_name) localStorage.setItem('telegram_bot_name', set.telegram_bot_name);
            if(document.getElementById('set_shop_name')) document.getElementById('set_shop_name').value = set.shopName || '';
            if(document.getElementById('sms_eskiz_email')) document.getElementById('sms_eskiz_email').value = set.sms_eskiz_email || '';
            if(document.getElementById('sms_eskiz_password')) document.getElementById('sms_eskiz_password').value = set.sms_eskiz_password || '';
            if(document.getElementById('sms_template')) document.getElementById('sms_template').value = set.sms_template || 'Hurmatli {name}! Ertaga {time} da {master} bilan uchrashuvingiz bor.';
            
            if(set.design) {
                if(document.getElementById('set_theme_color')) document.getElementById('set_theme_color').value = set.design.accentColor || '#ffffff';
                if(document.getElementById('set_theme_font')) document.getElementById('set_theme_font').value = set.design.fontFamily || 'Syncopate, sans-serif';
                if(document.getElementById('set_theme_bg')) document.getElementById('set_theme_bg').value = set.design.bgImage || 'assets/bg_1.jpg';
                if(document.getElementById('set_hide_ai')) document.getElementById('set_hide_ai').checked = !!set.design.hideAi;
                if(document.getElementById('set_hide_stats')) document.getElementById('set_hide_stats').checked = !!set.design.hideStats;
            }
            
            let tenants = await window.appDB.getGlobalTenants();
            let myT = tenants.find(t => t.id === window.appDB.tenantId);
            if(myT) {
                let emEl = document.getElementById('set_new_email');
                let pinEl = document.getElementById('set_new_pin');
                if(emEl && !emEl.value) emEl.value = myT.email || '';
                if(pinEl && !pinEl.value) pinEl.value = myT.pin || '';
            }

            const dDates = store.disabledDates || [];
            document.getElementById('disabled-dates-list').innerHTML = dDates.map(d => `<span class="tag">${d} <button onclick="removeDisabledDate('${d}')">&times;</button></span>`).join('');
            
            // Restore Telegram wizard state
            tgRestoreWizardState();
            
            // Generate QR code for booking link
            generateQR();
        }

        // ═══ QR CODE FUNCTIONS ═══
        function generateQR() {
            const bookingUrl = getBookingUrl();
            if (!bookingUrl) return;
            
            try {
                const qr = qrcode(0, 'M');
                qr.addData(bookingUrl);
                qr.make();
                
                const canvas = document.getElementById('qr-canvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const size = 200;
                canvas.width = size;
                canvas.height = size;
                
                const moduleCount = qr.getModuleCount();
                const cellSize = size / moduleCount;
                
                // White background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, size, size);
                
                // Draw QR modules
                ctx.fillStyle = '#000000';
                for (let row = 0; row < moduleCount; row++) {
                    for (let col = 0; col < moduleCount; col++) {
                        if (qr.isDark(row, col)) {
                            ctx.fillRect(col * cellSize, row * cellSize, cellSize + 0.5, cellSize + 0.5);
                        }
                    }
                }
            } catch(e) {
                console.warn('QR generation failed', e);
            }
        }

        function getBookingUrl() {
            const tenantId = window.appDB.tenantId;
            const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
            return `${window.location.origin}${path}/index.html?shop=${tenantId}`;
        }

        function downloadQR() {
            const canvas = document.getElementById('qr-canvas');
            if (!canvas) return;
            
            // Create a larger version for download (400x400)
            const downloadCanvas = document.createElement('canvas');
            downloadCanvas.width = 460;
            downloadCanvas.height = 520;
            const ctx = downloadCanvas.getContext('2d');
            
            // White background with padding
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 460, 520);
            
            // Draw QR code centered
            ctx.drawImage(canvas, 30, 30, 400, 400);
            
            // Add shop name text below
            const shopName = store.settings.shopName || 'Барбершоп';
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 22px Inter, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(shopName, 230, 460);
            
            ctx.font = '14px Inter, Arial, sans-serif';
            ctx.fillStyle = '#666666';
            ctx.fillText('Сканируйте для записи', 230, 490);
            
            // Download
            const link = document.createElement('a');
            link.download = `QR_${window.appDB.tenantId}.png`;
            link.href = downloadCanvas.toDataURL('image/png');
            link.click();
        }

        function copyBookingLink() {
            const url = getBookingUrl();
            navigator.clipboard.writeText(url).then(() => {
                alert('✅ Ссылка скопирована!');
            }).catch(() => {
                // Fallback for older browsers
                const ta = document.createElement('textarea');
                ta.value = url;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                alert('✅ Ссылка скопирована!');
            });
        }
        async function saveSettings(btn) {
            store.settings.openTime = document.getElementById('set_open').value || '10:00';
            store.settings.closeTime = document.getElementById('set_close').value || '21:00';
            store.settings.telegram_bot_token = document.getElementById('set_tg_token').value;
            if(document.getElementById('set_shop_name')) store.settings.shopName = document.getElementById('set_shop_name').value;
            if(document.getElementById('sms_eskiz_email')) store.settings.sms_eskiz_email = document.getElementById('sms_eskiz_email').value;
            if(document.getElementById('sms_eskiz_password')) store.settings.sms_eskiz_password = document.getElementById('sms_eskiz_password').value;
            if(document.getElementById('sms_template')) store.settings.sms_template = document.getElementById('sms_template').value;
            
            try {
                await window.appDB.saveSettings(store.settings);
                localStorage.setItem('barber_design_settings', JSON.stringify(store.settings.design));
                localStorage.setItem(window.appDB.tenantId + '_barber_settings', JSON.stringify(store.settings));

                let tenants = await window.appDB.getGlobalTenants();
                let myT = tenants.find(t => t.id === window.appDB.tenantId);
                if(myT && store.settings.shopName) {
                    myT.shopName = store.settings.shopName;
                    await window.appDB.saveGlobalTenants(tenants);
                    document.getElementById('header-shop-name').innerText = `— ${myT.shopName}`;
                }

                if(btn) { let o = btn.innerHTML; btn.innerHTML = '<i data-lucide="check" style="width:18px;height:18px;"></i> Сохранено'; btn.style.background = 'rgba(46,213,115,0.2)'; lucide.createIcons(); setTimeout(() => { btn.innerHTML = o; btn.style.background = ''; lucide.createIcons(); }, 1500); }
            } catch(e) {
                console.error('saveSettings error:', e);
                if(btn) { btn.innerHTML = '❌ Ошибка сохранения'; setTimeout(() => location.reload(), 2000); }
            }
        }

        async function saveDesignSettings(btn) {
            if(!store.settings.design) store.settings.design = {};
            store.settings.design.accentColor = document.getElementById('set_theme_color').value;
            store.settings.design.fontFamily = document.getElementById('set_theme_font').value;
            store.settings.design.bgImage = document.getElementById('set_theme_bg').value;
            store.settings.design.hideAi = document.getElementById('set_hide_ai').checked;
            store.settings.design.hideStats = document.getElementById('set_hide_stats').checked;
            
            try {
                await window.appDB.saveSettings(store.settings);
                localStorage.setItem('barber_design_settings', JSON.stringify(store.settings.design));
                localStorage.setItem(window.appDB.tenantId + '_barber_settings', JSON.stringify(store.settings));
                if(btn) { let o = btn.innerHTML; btn.innerHTML = '<i data-lucide="check" style="width:18px;height:18px;"></i> Сохранено'; btn.style.background = 'rgba(46,213,115,0.2)'; lucide.createIcons(); setTimeout(() => { btn.innerHTML = o; btn.style.background = ''; lucide.createIcons(); }, 1500); }
            } catch(e) {
                console.error('saveDesignSettings error:', e);
                if(btn) { btn.innerHTML = '❌ Ошибка'; setTimeout(() => location.reload(), 2000); }
            }
        }

        async function changeMyCredentials() {
            let newPin = document.getElementById('set_new_pin').value.trim();
            if(!newPin) return alert('Укажите новый PIN-код!');
            if(!confirm('ВНИМАНИЕ! После изменения PIN-кода вам нужно будет войти заново. Продолжить?')) return;
            
            let tenants = await window.appDB.getGlobalTenants();
            let myT = tenants.find(t => t.id === window.appDB.tenantId);
            if(myT) {
                myT.pin = newPin;
                await window.appDB.saveGlobalTenants(tenants);
                alert('Пароль успешно изменен! Войдите в панель заново.');
                sessionStorage.removeItem('adminAuth');
                location.reload();
            } else {
                alert('Ошибка: ваш аккаунт не найден в глобальной базе.');
            }
        }
        function saveAIKey(btn) {
            const key = document.getElementById('set_ai_key').value.trim();
            localStorage.setItem('openrouter_api_key', key);
            localStorage.setItem('chatbot_api_key', key);
            if(btn) { 
                let o = btn.innerHTML; 
                btn.innerHTML = '<i data-lucide="check" style="width:18px;height:18px;"></i> Сохранено';
                btn.style.background = 'rgba(46,213,115,0.2)';
                lucide.createIcons();
                setTimeout(() => { btn.innerHTML = o; btn.style.background = ''; lucide.createIcons(); }, 2000);
            }
        }

        // ═══ TELEGRAM SETUP WIZARD ═══
        let tgWizardToken = '';
        let tgWizardChatId = '';

        function tgShowStatus(text, type) {
            const el = document.getElementById('tg-status');
            el.style.display = 'flex';
            const colors = { success: '#2ed573', error: '#ff4757', info: '#5e6ad2' };
            const icons = { success: '✅', error: '❌', info: 'ℹ️' };
            el.style.background = `${colors[type]}15`;
            el.style.border = `1px solid ${colors[type]}40`;
            el.style.color = colors[type];
            el.innerHTML = `${icons[type]} ${text}`;
        }

        async function tgWizardStep2(btn) {
            const token = document.getElementById('tg_bot_token').value.trim();
            if (!token || !token.includes(':')) {
                tgShowStatus('Неверный формат токена. Токен выглядит как: 123456789:ABCdefGHI...', 'error');
                return;
            }
            
            btn.disabled = true;
            btn.innerHTML = '⏳ Проверяю...';
            
            try {
                // Validate token via getMe
                const resp = await fetch(`https://api.telegram.org/bot${token}/getMe`);
                const data = await resp.json();
                
                if (!data.ok) {
                    tgShowStatus('Токен недействителен. Проверьте, что вы правильно скопировали его из @BotFather.', 'error');
                    btn.disabled = false;
                    btn.innerHTML = 'Далее →';
                    return;
                }
                
                const botUsername = data.result.username;
                tgWizardToken = token;
                
                // Show step 2
                document.getElementById('tg-step-1').style.display = 'none';
                document.getElementById('tg-step-2').style.display = 'block';
                document.getElementById('tg-bot-link').href = `https://t.me/${botUsername}`;
                
                tgShowStatus(`Бот @${botUsername} найден и работает!`, 'success');
                
                // Save bot username for Telegram widget
                localStorage.setItem('telegram_bot_name', botUsername);
                store.settings.telegram_bot_name = botUsername;
                await window.appDB.saveSettings(store.settings);
                localStorage.setItem('barber_design_settings', JSON.stringify(store.settings.design));
                localStorage.setItem(window.appDB.tenantId + '_barber_settings', JSON.stringify(store.settings));
                
            } catch(e) {
                tgShowStatus('Ошибка сети. Проверьте интернет-соединение.', 'error');
                btn.disabled = false;
                btn.innerHTML = 'Далее →';
            }
        }

        async function tgDetectChatId(btn) {
            if (!tgWizardToken) { tgShowStatus('Сначала введите токен бота.', 'error'); return; }
            
            btn.disabled = true;
            btn.innerHTML = '⏳ Ищу...';
            const statusEl = document.getElementById('tg-detect-status');
            statusEl.innerHTML = 'Опрашиваю бота... Убедитесь, что вы отправили ему /start';
            
            let attempts = 0;
            const maxAttempts = 3;
            
            const tryDetect = async () => {
                try {
                    const resp = await fetch(`https://api.telegram.org/bot${tgWizardToken}/getUpdates?limit=10&offset=-10`);
                    const data = await resp.json();
                    
                    if (data.ok && data.result.length > 0) {
                        // Find the latest /start message or any message
                        let chatId = null;
                        let chatName = '';
                        
                        for (let i = data.result.length - 1; i >= 0; i--) {
                            const msg = data.result[i].message;
                            if (msg && msg.chat) {
                                chatId = msg.chat.id;
                                chatName = msg.chat.first_name || msg.chat.title || '';
                                break;
                            }
                        }
                        
                        if (chatId) {
                            tgWizardChatId = chatId.toString();
                            
                            // Save to settings
                            const fullToken = `${tgWizardToken}@@${tgWizardChatId}`;
                            document.getElementById('set_tg_token').value = fullToken;
                            store.settings.telegram_bot_token = fullToken;
                            await window.appDB.saveSettings(store.settings);
                localStorage.setItem('barber_design_settings', JSON.stringify(store.settings.design));
                localStorage.setItem(window.appDB.tenantId + '_barber_settings', JSON.stringify(store.settings));
                            
                            // Show step 3
                            document.getElementById('tg-step-2').style.display = 'none';
                            document.getElementById('tg-step-3').style.display = 'block';
                            document.getElementById('tg-found-chatid').textContent = tgWizardChatId;
                            
                            tgShowStatus(`Подключено! ${chatName ? 'Привет, ' + chatName + '!' : ''} Уведомления будут приходить сюда.`, 'success');
                            return;
                        }
                    }
                    
                    attempts++;
                    if (attempts < maxAttempts) {
                        statusEl.innerHTML = `Попытка ${attempts + 1}/${maxAttempts}... Откройте бота и отправьте /start`;
                        setTimeout(tryDetect, 3000);
                    } else {
                        statusEl.innerHTML = '⚠️ Не удалось найти сообщения. Откройте бота в Telegram, отправьте /start, и нажмите "Найти Chat ID" снова.';
                        btn.disabled = false;
                        btn.innerHTML = '🔍 Найти Chat ID';
                    }
                } catch(e) {
                    statusEl.innerHTML = '⚠️ Ошибка сети: ' + e.message;
                    btn.disabled = false;
                    btn.innerHTML = '🔍 Найти Chat ID';
                }
            };
            
            await tryDetect();
        }

        async function tgSendTest(btn) {
            if (!tgWizardToken || !tgWizardChatId) { tgShowStatus('Не настроено.', 'error'); return; }
            
            btn.disabled = true;
            btn.innerHTML = '⏳ Отправляю...';
            
            const shopName = store.settings.shopName || 'Ваш Барбершоп';
            const msg = `✅ Тест успешен!\n\n🏪 ${shopName}\n📅 Теперь вы будете получать уведомления о каждой новой записи в этот чат.\n\n💈 Система уведомлений работает!`;
            
            try {
                const resp = await fetch(`https://api.telegram.org/bot${tgWizardToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: tgWizardChatId, text: msg })
                });
                const data = await resp.json();
                
                if (data.ok) {
                    tgShowStatus('Тестовое сообщение отправлено! Проверьте Telegram.', 'success');
                } else {
                    tgShowStatus('Ошибка: ' + (data.description || 'Неизвестная ошибка'), 'error');
                }
            } catch(e) {
                tgShowStatus('Ошибка сети: ' + e.message, 'error');
            }
            
            btn.disabled = false;
            btn.innerHTML = '📨 Отправить тестовое сообщение';
        }

        async function tgSendMonthlyReminders(btn) {
            const statusEl = document.getElementById('tg-monthly-status');
            if (!tgWizardToken) {
                statusEl.innerHTML = '❌ Бот Telegram не подключен.';
                return;
            }

            if (btn) btn.disabled = true;
            statusEl.innerHTML = '⏳ Поиск клиентов, не стригшихся 25+ дней...';

            const bookings = await window.appDB.getBookings();
            const now = new Date();
            const nowTime = now.getTime();
            const dayMs = 86400000;

            const clientMap = {};
            for (const b of bookings) {
                if (b.status === 'cancelled') continue;
                const key = b.telegramChatId || b.phone || b.name;
                if (!key) continue;

                if (!clientMap[key]) {
                    clientMap[key] = {
                        name: b.name,
                        phone: b.phone,
                        telegramChatId: b.telegramChatId,
                        lastBookingDate: b.date,
                        futureBooking: false
                    };
                }

                const bDate = new Date(b.date);
                if (bDate.getTime() > nowTime) {
                    clientMap[key].futureBooking = true;
                }
                if (b.date > clientMap[key].lastBookingDate) {
                    clientMap[key].lastBookingDate = b.date;
                }
            }

            const eligibleClients = [];
            for (const key in clientMap) {
                const c = clientMap[key];
                if (c.futureBooking || !c.telegramChatId) continue;

                const lastDate = new Date(c.lastBookingDate);
                const diffDays = Math.floor((nowTime - lastDate.getTime()) / dayMs);

                if (diffDays >= 25) {
                    eligibleClients.push(c);
                }
            }

            if (eligibleClients.length === 0) {
                statusEl.innerHTML = 'ℹ️ Нет подходящих клиентов (прошло меньше 25 дней или нет зарегистрированных Telegram ID).';
                if (btn) btn.disabled = false;
                return;
            }

            statusEl.innerHTML = `📤 Отправка личных напоминаний ${eligibleClients.length} клиентам...`;
            let sent = 0, failed = 0;
            const shopName = store.settings.shopName || 'Ваш Барбершоп';

            for (const c of eligibleClients) {
                const msg = `👋 Здравствуйте, ${c.name}!\n\n💈 В ${shopName} мы заметили, что прошёл уже месяц с вашего последнего визита.\n\n✂️ Пора обновить стрижку и стиль! Будем рады видеть вас снова.\n\n📅 Записаться в 1 клик через наш Mini App!`;
                try {
                    const resp = await fetch(`https://api.telegram.org/bot${tgWizardToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: c.telegramChatId, text: msg })
                    });
                    const data = await resp.json();
                    if (data.ok) sent++;
                    else failed++;
                } catch(e) {
                    failed++;
                }
            }

            statusEl.innerHTML = `🎉 Готово! Успешно отправлено: ${sent} клиентам в личку. Ошибок: ${failed}.`;
            if (btn) btn.disabled = false;
        }

        async function tgDisconnect() {
            if (!confirm('Отключить Telegram уведомления?')) return;
            tgWizardToken = '';
            tgWizardChatId = '';
            document.getElementById('set_tg_token').value = '';
            store.settings.telegram_bot_token = '';
            await window.appDB.saveSettings(store.settings);
                localStorage.setItem('barber_design_settings', JSON.stringify(store.settings.design));
                localStorage.setItem(window.appDB.tenantId + '_barber_settings', JSON.stringify(store.settings));
            
            document.getElementById('tg-step-1').style.display = 'block';
            document.getElementById('tg-step-2').style.display = 'none';
            document.getElementById('tg-step-3').style.display = 'none';
            document.getElementById('tg_bot_token').value = '';
            document.getElementById('tg-status').style.display = 'none';
        }

        function tgRestoreWizardState() {
            const saved = store.settings.telegram_bot_token || '';
            if (saved && saved.includes('@@')) {
                const parts = saved.split('@@');
                tgWizardToken = parts[0];
                tgWizardChatId = parts[1];
                
                // Show step 3 (connected state)
                document.getElementById('tg-step-1').style.display = 'none';
                document.getElementById('tg-step-2').style.display = 'none';
                document.getElementById('tg-step-3').style.display = 'block';
                document.getElementById('tg-found-chatid').textContent = tgWizardChatId;
                tgShowStatus('Telegram подключен и работает! 🎉', 'success');
            }
        }
        // ═══ SMS REMINDER FUNCTIONS ═══
        async function saveSmsSettings(btn) {
            store.settings.sms_eskiz_email = document.getElementById('sms_eskiz_email').value.trim();
            store.settings.sms_eskiz_password = document.getElementById('sms_eskiz_password').value;
            store.settings.sms_template = document.getElementById('sms_template').value.trim();
            await window.appDB.saveSettings(store.settings);
                localStorage.setItem('barber_design_settings', JSON.stringify(store.settings.design));
                localStorage.setItem(window.appDB.tenantId + '_barber_settings', JSON.stringify(store.settings));
            if(btn) { let o = btn.innerHTML; btn.innerHTML = '<i data-lucide="check" style="width:18px;height:18px;"></i> Сохранено'; btn.style.background = 'rgba(46,213,115,0.2)'; lucide.createIcons(); setTimeout(() => { btn.innerHTML = o; btn.style.background = ''; lucide.createIcons(); }, 1500); }
        }

        async function getEskizToken(email, password) {
            const fd = new FormData();
            fd.append('email', email);
            fd.append('password', password);
            const res = await fetch('https://notify.eskiz.uz/api/auth/login', { method: 'POST', body: fd });
            if(!res.ok) throw new Error('Eskiz auth failed: ' + res.status);
            const json = await res.json();
            return json.data && json.data.token ? json.data.token : null;
        }

        async function sendSmsReminders(btn) {
            const statusEl = document.getElementById('sms-status');
            const email = (store.settings.sms_eskiz_email || '').trim();
            const password = store.settings.sms_eskiz_password || '';
            const template = store.settings.sms_template || 'Hurmatli {name}! Ertaga {time} da {master} bilan uchrashuvingiz bor.';
            const shopName = store.settings.shopName || 'Barbershop';

            if(!email || !password) {
                statusEl.innerHTML = '❌ Eskiz email va parolni kiriting va saqlang.';
                return;
            }

            if(btn) btn.disabled = true;
            statusEl.innerHTML = '⏳ Tokenni olish...';

            let token;
            try {
                token = await getEskizToken(email, password);
            } catch(e) {
                statusEl.innerHTML = '❌ Eskiz autentifikatsiya xatosi: ' + e.message;
                if(btn) btn.disabled = false;
                return;
            }
            if(!token) {
                statusEl.innerHTML = '❌ Token olinmadi. Email/parolni tekshiring.';
                if(btn) btn.disabled = false;
                return;
            }

            // Get tomorrow's date string YYYY-MM-DD
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            const bookings = await window.appDB.getBookings();
            const tomorrowBookings = bookings.filter(b => b.date === tomorrowStr && b.phone && b.status !== 'cancelled');

            if(tomorrowBookings.length === 0) {
                statusEl.innerHTML = `✅ ${tomorrowStr} uchun bron yo'q.`;
                if(btn) btn.disabled = false;
                return;
            }

            statusEl.innerHTML = `📤 ${tomorrowBookings.length} ta mijozga SMS yuborilmoqda...`;
            let sent = 0, failed = 0;

            for(const b of tomorrowBookings) {
                // Normalize phone: strip non-digits, ensure starts with 998
                let phone = (b.phone || '').replace(/\D/g, '');
                if(phone.startsWith('0')) phone = '998' + phone.slice(1);
                if(!phone.startsWith('998')) phone = '998' + phone;
                if(phone.length < 12) { failed++; continue; }

                let msg = template
                    .replace('{name}', b.name || '')
                    .replace('{phone}', b.phone || '')
                    .replace('{master}', b.masterName || '')
                    .replace('{service}', b.service || '')
                    .replace('{date}', b.date || '')
                    .replace('{time}', b.time || '')
                    .replace('{shop}', shopName);

                try {
                    const fd = new FormData();
                    fd.append('mobile_phone', phone);
                    fd.append('message', msg);
                    fd.append('from', '4546');
                    const res = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token },
                        body: fd
                    });
                    if(res.ok) sent++;
                    else failed++;
                } catch(e) {
                    failed++;
                }
            }

            statusEl.innerHTML = `✅ Yuborildi: ${sent} ta. ❌ Xato: ${failed} ta.`;
            if(btn) btn.disabled = false;
        }

        function addDisabledDate() {
            let val = document.getElementById('disable-date-input').value; if(!val) return;
            if(!store.disabledDates) store.disabledDates = [];
            if(!store.disabledDates.includes(val)) { store.disabledDates.push(val); localStorage.setItem(DB_DISABLED_DATES, JSON.stringify(store.disabledDates)); renderSettingsTab(); }
        }
        function removeDisabledDate(val) {
            showCustomConfirm('Удалить дату из списка?', async () => {
                store.disabledDates = (store.disabledDates || []).filter(d => d !== val); localStorage.setItem(DB_DISABLED_DATES, JSON.stringify(store.disabledDates)); renderSettingsTab();
            });
        }

        // SERVICES (from before)
        function renderServicesEditor() {
            let html = '';
            store.services.forEach(s => {
                let dur = s.duration || 60;
                html += `
                <div class="admin-card" style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: var(--accent);">${s.strings.ru.title}</h4>
                        <button class="btn-danger" style="width: auto; padding: 6px 12px; font-size: 0.8rem;" onclick="deleteService('${s.id}')">Удалить</button>
                    </div>
                    <div style="display: flex; gap: 15px; margin-bottom: 15px; align-items: flex-end; flex-wrap: wrap;">
                        <div class="form-group" style="margin:0; flex: 2; min-width: 250px;"><label>Название на сайт (RU)</label><input type="text" id="title_ru_${s.id}" class="form-control" value="${s.strings.ru.title}"></div>
                        <div class="form-group" style="margin:0; flex: 1; min-width: 150px;"><label>Цена (₽)</label><input type="number" id="price_${s.id}" class="form-control" value="${s.price}"></div>
                        <div class="form-group" style="margin:0; flex: 1; min-width: 150px;">
                            <label>Длительность (мин)</label>
                            <select id="duration_${s.id}" class="form-control" style="appearance:auto;">
                                <option value="30" ${dur==30?'selected':''}>30 мин</option>
                                <option value="60" ${dur==60?'selected':''}>1 час</option>
                                <option value="90" ${dur==90?'selected':''}>1.5 часа</option>
                                <option value="120" ${dur==120?'selected':''}>2 часа</option>
                                <option value="180" ${dur==180?'selected':''}>3 часа</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group"><label>Описание снизу (RU)</label><input type="text" id="desc_ru_${s.id}" class="form-control" value="${s.strings.ru.desc}"></div>
                    <button class="btn" style="padding: 10px 20px; font-size: 0.9rem; width: auto;" onclick="saveService('${s.id}')">💾 Сохранить изменения для "${s.strings.ru.title}"</button>
                </div>`;
            });
            document.getElementById('admin-services-list').innerHTML = html;
        }

        const defaultServiceTemplates = [
            { price: 1500, duration: 60, ru: "Мужская стрижка", en: "Men's Haircut", uz: "Erkaklar soch turmagi", kg: "Эркектердин чач кыркуусу" },
            { price: 1000, duration: 45, ru: "Детская стрижка (до 10 лет)", en: "Kids Haircut (under 10)", uz: "Bolalar soch turmagi (10 yoshgacha)", kg: "Балдар чач кыркуусу (10 жашка чейин)" },
            { price: 800, duration: 30, ru: "Моделирование бороды", en: "Beard Trim & Shape", uz: "Soqol turmagi", kg: "Сакалды моделдөө" },
            { price: 700, duration: 30, ru: "Стрижка под машинку (одна насадка)", en: "Buzz Cut / Clipper Cut", uz: "Mashinkada soch olish", kg: "Машинка менен чач кыркуу" },
            { price: 500, duration: 30, ru: "Укладка (стайлинг)", en: "Hair Styling", uz: "Soch turmaklash", kg: "Чачты стилдештирүү" },
            { price: 1200, duration: 45, ru: "Премиум моделирование бороды", en: "Premium Beard Shaping", uz: "Premium soqol turmagi", kg: "Премиум сакал моделдөө" },
            { price: 1000, duration: 30, ru: "Камуфляж седины", en: "Grey Hair Camouflage", uz: "Oq sochlarni yashirish", kg: "Ак чачтарды жашыруу (Камуфляж)" },
            { price: 300, duration: 15, ru: "Коррекция воском", en: "Waxing", uz: "Mumi bilan tozalash", kg: "Мом менен коррекция" },
            { price: 500, duration: 30, ru: "Черная очищающая маска", en: "Black Peel-off Mask", uz: "Qora tozalovchi niqob", kg: "Кара тазалоочу маска" },
            { price: 1500, duration: 30, ru: "Премиум уход за кожей головы", en: "Premium Scalp Care", uz: "Bosh terisi uchun premium parvarish", kg: "Баш терисине премиум кам көрүү" },
            { price: 1500, duration: 45, ru: "Премиум уход за лицом", en: "Premium Facial Care", uz: "Yuz uchun premium parvarish", kg: "Бетке премиум кам көрүү" },
            { price: 300, duration: 15, ru: "Патчи", en: "Eye Patches", uz: "Ko'z patchlari", kg: "Көз патчтары" },
            { price: 2300, duration: 90, ru: "Папа + Сын", en: "Father + Son Combo", uz: "Ota + Og'il", kg: "Ата + Уул" },
            { price: 2100, duration: 90, ru: "Стрижка + моделирование бороды", en: "Haircut + Beard Trim", uz: "Soch va Soqol turmagi", kg: "Чач кыркуу + сакалды моделдөө" },
            { price: 2500, duration: 90, ru: "Стрижка + премиум моделирование бороды", en: "Haircut + Premium Beard", uz: "Soch + Premium soqol", kg: "Чач кыркуу + премиум сакал" }
        ];

        async function addService() {
            let sId = 's_' + Date.now();
            let templateSelect = document.getElementById('new_service_template');
            let tVal = templateSelect ? templateSelect.value : 'custom';
            
            let newS = {
                id: sId,
                price: 1000,
                duration: 60,
                strings: {
                    ru: { title: "Новая Услуга", desc: "" },
                    en: { title: "New Service", desc: "" },
                    uz: { title: "Yangi Xizmat", desc: "" },
                    kg: { title: "Жаңы Кызмат", desc: "" }
                }
            };

            if (tVal !== 'custom') {
                let tIdx = parseInt(tVal);
                let tmpl = defaultServiceTemplates[tIdx];
                if(tmpl) {
                    newS.price = tmpl.price;
                    newS.duration = tmpl.duration;
                    newS.strings.ru.title = tmpl.ru;
                    newS.strings.en.title = tmpl.en;
                    newS.strings.uz.title = tmpl.uz;
                    newS.strings.kg.title = tmpl.kg;
                }
            }

            store.services.push(newS);
            await window.appDB.saveServices(store.services);
            renderServicesEditor();
            alert(tVal === 'custom' ? 'Услуга создана! Отредактируйте её параметры ниже.' : `Услуга "${newS.strings.ru.title}" успешно добавлена!`);
        }

        async function deleteService(id) {
            showCustomConfirm('Удалить эту услугу навсегда?', async () => {
                store.services = store.services.filter(s => s.id !== id);
                await window.appDB.saveServices(store.services);
                renderServicesList(store.services);
                renderManualOptions(store.services, store.masters);
                renderServicesEditor();
            });
        }

        async function saveService(id) {
            let s = store.services.find(x => x.id === id);
            if(s) {
                s.price = parseInt(document.getElementById(`price_${id}`).value) || 0;
                s.duration = parseInt(document.getElementById(`duration_${id}`).value);

                let curTitle = document.getElementById(`title_ru_${id}`).value;
                let curDesc = document.getElementById(`desc_ru_${id}`).value;

                if(!s.strings) s.strings = {};
                if(!s.strings.ru) s.strings.ru = { title: "", desc: "" };

                s.strings.ru.title = curTitle;
                s.strings.ru.desc = curDesc;

                // Sync to other languages if they are still the default placeholder
                if (!s.strings.en || s.strings.en.title === "New Service" || s.strings.en.title === "") {
                    ['en', 'uz', 'kg'].forEach(l => {
                        if(!s.strings[l]) s.strings[l] = {};
                        s.strings[l].title = curTitle;
                        s.strings[l].desc = curDesc;
                    });
                }

                await window.appDB.saveServices(store.services);
                alert('✅ Сохранено!');
                
                // Re-render to update the header title of the card if it was RU
                if(currentAdminLang === 'ru') renderServicesEditor();
            }
        }

        let notificationsEnabled = localStorage.getItem('admin_notifications') === 'true';
        
        // Built-in notification sound using Web Audio API (no external files needed!)
        function playNotifSound() {
            try {
                // Try custom sound first
                const customAudio = new Audio('assets/notification.mp3');
                const playPromise = customAudio.play();
                if (playPromise) {
                    playPromise.catch(() => {
                        // Custom file missing or blocked — use synthesized chime
                        synthesizeChime();
                    });
                }
            } catch(e) {
                synthesizeChime();
            }
        }
        
        function synthesizeChime() {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                
                // First tone (higher pitch)
                const playTone = (freq, startTime, duration) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
                    gain.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
                    
                    osc.start(ctx.currentTime + startTime);
                    osc.stop(ctx.currentTime + startTime + duration);
                };
                
                // Pleasant two-tone chime: C6 → E6
                playTone(1047, 0, 0.3);      // C6
                playTone(1319, 0.15, 0.4);    // E6
                // Second chime after pause
                playTone(1047, 0.6, 0.3);     // C6
                playTone(1568, 0.75, 0.5);    // G6
                
            } catch(e) {
                console.log('Audio not supported');
            }
        }
        
        function toggleNotifications() {
            notificationsEnabled = !notificationsEnabled;
            localStorage.setItem('admin_notifications', notificationsEnabled);
            updateNotifButton();
            
            if (notificationsEnabled) {
                // Play test sound to confirm
                playNotifSound();
                
                // Request browser notification permission
                if ("Notification" in window) {
                    Notification.requestPermission();
                }
            }
        }

        function updateNotifButton() {
            const btn = document.getElementById('notif-toggle-btn');
            if (!btn) return;
            if (notificationsEnabled) {
                btn.innerHTML = '<i data-lucide="bell" style="width:16px;height:16px;margin-right:4px;position:relative;top:-1px;"></i> ЗВУК ВКЛ';
                btn.style.background = 'rgba(46,213,115,0.15)';
                btn.style.color = '#2ed573';
                btn.style.borderColor = '#2ed57350';
            } else {
                btn.innerHTML = '<i data-lucide="bell-off" style="width:16px;height:16px;margin-right:4px;position:relative;top:-1px;"></i> ЗВУК ВЫКЛ';
                btn.style.background = 'rgba(255,71,87,0.1)';
                btn.style.color = '#ff4757';
                btn.style.borderColor = '#ff475750';
            }
            lucide.createIcons();
        }

        function playNewBookingAlert(booking) {
            // Play notification sound
            playNotifSound();
            
            // Show visual toast in admin panel
            showBookingToast(booking);
            
            // Browser notification (if permitted)
            if ("Notification" in window && Notification.permission === "granted") {
                try {
                    const name = booking.name || 'Клиент';
                    const service = booking.service || '';
                    new Notification("🔔 Новая запись!", {
                        body: `${name} записался${service ? ' на ' + service : ''}`,
                        icon: "https://cdn-icons-png.flaticon.com/512/3050/3050267.png"
                    });
                } catch(e) {}
            }
        }

        function showBookingToast(booking) {
            // Remove old toast if exists
            const old = document.getElementById('booking-toast');
            if (old) old.remove();
            
            const name = booking.name || 'Клиент';
            const service = booking.service || '';
            const time = booking.time || '';
            const date = booking.date || '';
            
            const toast = document.createElement('div');
            toast.id = 'booking-toast';
            toast.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 99999;
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 1px solid #2ed573; border-radius: 6px;
                padding: 16px 20px; min-width: 280px; max-width: 380px;
                box-shadow: 0 8px 32px rgba(46,213,115,0.3);
                animation: toastSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                font-family: 'Inter', sans-serif; color: white;
            `;
            toast.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px; margin-bottom: 8px;">
                    <i data-lucide="bell" style="width:20px;height:20px;color:#2ed573;"></i>
                    <strong style="color:#2ed573; font-size: 1rem;">Новое уведомление!</strong>
                    <button onclick="this.parentElement.parentElement.remove()" style="margin-left:auto; background:none; border:none; color:#888; cursor:pointer; font-size:1.2rem;">✕</button>
                </div>
                <div style="font-size:0.9rem; color:#ccc;">
                    <i data-lucide="user" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> ${name}<br>
                    ${service ? '<i data-lucide="scissors" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> ' + service + '<br>' : ''}
                    ${date ? '<i data-lucide="calendar" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> ' + date + (time ? ' в ' + time : '') + '<br>' : ''}
                </div>
            `;
            document.body.appendChild(toast);
            lucide.createIcons();
            
            // Auto-remove after 8 seconds
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.style.animation = 'toastSlideOut 0.3s ease';
                    setTimeout(() => toast.remove(), 300);
                }
            }, 8000);
        }

        // Add toast animations CSS
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes toastSlideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(120%); opacity: 0; } }
            `;
            document.head.appendChild(style);
        }

        // --- APGRADE LOGIC ---

        function renderClientsTab() {
            let bookings = store.bookings;
            let clients = {};
            bookings.forEach(b => {
                let st = b.status || 'pending';
                if(st === 'cancelled') return; // Игнорируем отмененных вообще для визитов
                
                let p = b.phone.trim();
                if(!clients[p]) clients[p] = { name: b.name, phone: p, visits: 0, revenue: 0, lastVisit: b.date };
                
                clients[p].visits++;
                if (st === 'completed') {
                    clients[p].revenue += parseInt(b.price || 0);
                }
                
                if (b.date > clients[p].lastVisit) clients[p].lastVisit = b.date;
                clients[p].name = b.name; // обновляем имя на более свежее
            });
            let arr = Object.values(clients).sort((a,b) => b.revenue - a.revenue);
            document.getElementById('admin-clients-list').innerHTML = arr.map(c => `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 15px; font-weight: 500;">${c.name}</td>
                    <td style="padding: 15px; color: var(--text-muted);">${c.phone}</td>
                    <td style="padding: 15px;">${c.visits}</td>
                    <td style="padding: 15px; color: var(--text-muted);">${c.lastVisit}</td>
                    <td style="padding: 15px; color: var(--accent); font-weight: 600;">${c.revenue} ₽</td>
                </tr>
            `).join('');
        }

        function exportToCSV() {
            let bookings = store.bookings;
            if(bookings.length === 0) { alert('Нет данных для выгрузки!'); return; }
            
            let csv = '\uFEFF'; // BOM for Excel UTF-8
            csv += 'Дата;Время;Имя клиента;Телефон;Услуга;Цена(RUB);Мастер\n';
            bookings.forEach(b => {
                let mName = b.masterName === 'any' ? 'Любой' : (b.masterName || 'Любой');
                csv += `${b.date};${b.time};${b.name};${b.phone};${b.service};${b.price || 0};${mName}\n`;
            });
            
            let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            let link = document.createElement("a");
            let url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `barbershop_base_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        let revenueChartInstance = null;
        let mastersChartInstance = null;

        function renderCharts() {
            let bookings = store.bookings;
            
            // 7 Days Revenue
            let todayObj = new Date();
            let labels7Days = [];
            let data7Days = [];
            for (let i=6; i>=0; i--) {
                let d = new Date(todayObj); d.setDate(d.getDate() - i);
                let iso = d.toISOString().split('T')[0];
                labels7Days.push(d.toLocaleDateString('ru-RU', {day:'numeric', month:'short'}));
                let dayRev = bookings.filter(b => b.date === iso && b.status === 'completed').reduce((sum, b) => sum + parseInt(b.price || 0), 0);
                data7Days.push(dayRev);
            }

            if(revenueChartInstance) revenueChartInstance.destroy();
            let ctxRev = document.getElementById('revenueChart').getContext('2d');
            revenueChartInstance = new Chart(ctxRev, {
                type: 'bar',
                data: { labels: labels7Days, datasets: [{ label: 'Доход Завершено (₽)', data: data7Days, backgroundColor: '#2ed573', borderRadius: 4 }] },
                options: { responsive: true, scales: { y: { beginAtZero: true, grid: { color: 'var(--overlay-light)' } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } }
            });

            // Master shares
            let mastersRev = {};
            bookings.forEach(b => {
                if (b.status !== 'completed') return; // Только завершенные стрижки!
                let m = b.masterName === 'any' ? 'Без мастера' : (b.masterName || 'Удаленный мастер');
                if(!mastersRev[m]) mastersRev[m] = 0;
                mastersRev[m] += parseInt(b.price || 0);
            });
            let mLabels = Object.keys(mastersRev);
            let mData = Object.values(mastersRev);
            
            if(mastersChartInstance) mastersChartInstance.destroy();
            let ctxMast = document.getElementById('mastersChart').getContext('2d');
            mastersChartInstance = new Chart(ctxMast, {
                type: 'doughnut',
                data: { labels: mLabels, datasets: [{ data: mData, backgroundColor: ['#d4af37', '#1e90ff', '#2ed573', '#ff4757', '#9b59b6'], borderWidth: 0, hoverOffset: 4 }] },
                options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#f0f0f0' } } } }
            });
        }

        function renderCalendarGrid() {
            let container = document.getElementById('calendar-grid');
            let todayObjDate = new Date();
            let today = todayObjDate.toISOString().split('T')[0];
            let dayOfWeek = todayObjDate.getDay();
            
            document.getElementById('grid-today-date').innerText = todayObjDate.toLocaleDateString('ru-RU', {day:'numeric', month:'long'});
            
            let settings = store.settings;
            let masters = store.masters;
            let allServices = store.services;
            // В календарь выводим только НЕ отмененные записи
            let bookings = store.bookings.filter(b => b.date === today && b.status !== 'cancelled');
            
            let mastersCopy = [...masters];
            // If any booking is assigned to 'any', add a virtual column for them
            if (store.bookings.find(b => b.date === today && b.status !== 'cancelled' && b.masterId === 'any')) {
                mastersCopy.push({ id: 'any', name: 'Ожидают распределения', workingDays: [0,1,2,3,4,5,6] });
            }

            let html = '<tr><th style="width: 80px;">Время</th>';
            mastersCopy.forEach(m => { html += `<th>${m.name}</th>`; });
            html += '</tr>';
            
            let tObj = new Date(`2000-01-01T${settings.openTime}:00`);
            let eObj = new Date(`2000-01-01T${settings.closeTime}:00`);

            // To handle rowspans, track skip counts per master
            let skipCells = {};
            masters.forEach(m => skipCells[m.id] = 0);
            
            while(tObj < eObj) {
                let ts = tObj.toTimeString().substring(0,5);
                html += `<tr><td style="color:var(--text-muted); font-size:0.9rem;">${ts}</td>`;

                mastersCopy.forEach(m => {
                    let mDays = m.workingDays || [1,2,3,4,5,6,0];
                    let isWorking = mDays.includes(dayOfWeek);

                    if (!isWorking) {
                        html += `<td style="background: rgba(255,255,255,0.02); color: var(--text-muted); opacity: 0.5;">ВЫХОДНОЙ</td>`;
                        return;
                    }

                    if (skipCells[m.id] > 0) {
                        skipCells[m.id]--;
                        return; // Cell covered by rowspan
                    }

                    let b = bookings.find(x => x.time === ts && x.masterId === m.id);
                    if (b) {
                        // Calculate duration in 30-min chunks
                        let serv = allServices.find(s => s.id === b.serviceKey || s.strings.ru.title === b.service) || {};
                        let duration = parseInt(serv.duration) || 60; 
                        // MUST be integer to prevent decimal rowspan which completely breaks HTML tables
                        let chunks = Math.round(duration / 30);
                        let rowSpan = Math.max(1, chunks);
                        
                        skipCells[m.id] = rowSpan - 1;

                        let st = b.status || 'pending';
                        let bdCol = 'var(--accent)'; let icon = '<i data-lucide="clock" style="width:14px;height:14px;color:var(--accent);"></i>';
                        if (st === 'completed') { bdCol = '#2ed573'; icon = '<i data-lucide="check-circle" style="width:14px;height:14px;color:#2ed573;"></i>'; }
                        else if (st === 'in_progress') { bdCol = '#1e90ff'; icon = '<i data-lucide="play-circle" style="width:14px;height:14px;color:#1e90ff;"></i>'; }
                        
                        html += `<td rowspan="${rowSpan}" draggable="true" ondragstart="dragBooking(event, '${b.id}')" class="grid-cell-booked timeline-card" style="border-color:${bdCol}; cursor: grab;" ondragend="this.classList.remove('dragging')"><div class="grid-cell-booked-inner" style="display:flex;align-items:center;justify-content:center;gap:4px;">${icon} ${b.name}</div><div class="grid-cell-booked-sub">${b.service}</div></td>`;
                    } else {
                        html += `<td class="grid-cell-empty timeline-cell" onclick="fastBook('${ts}', '${m.id}')" ondragover="event.preventDefault()" ondragenter="this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="dropBooking(event, '${ts}', '${m.id}')">+ ${ts}</td>`;
                    }
                });
                
                html += '</tr>';
                tObj.setMinutes(tObj.getMinutes() + 30); // 30 Minute step!
            }
            container.innerHTML = html;
        }

        // DRAG AND DROP HANDLERS
        function dragBooking(ev, id) {
            ev.dataTransfer.setData('text/plain', id);
            ev.currentTarget.classList.add('dragging');
        }

        async function dropBooking(ev, newTime, newMasterId) {
            ev.preventDefault();
            ev.currentTarget.classList.remove('drag-over');
            let id = ev.dataTransfer.getData('text/plain');
            if(!id) return;

            let booking = store.bookings.find(x => x.id === id);
            if(!booking) return;

            // Optional: Prevent drag if completed or cancelled?
            if(booking.status === 'completed' || booking.status === 'cancelled') {
                alert('Нельзя переносить завершенные или отмененные записи!'); 
                return;
            }

            let confirmMove = confirm(`Перенести запись клиента ${booking.name} на ${newTime}?`);
            if(!confirmMove) return;

            let today = new Date().toISOString().split('T')[0];
            booking.date = today;
            booking.time = newTime;
            booking.masterId = newMasterId;
            let mObj = store.masters.find(m => m.id === newMasterId);
            booking.masterName = mObj ? mObj.name : 'Любой';

            await window.appDB.saveBookings(store.bookings);
        }

        function renderProductsList(products) {
            const list = document.getElementById('admin-products-list');
            if(!list || !products) return;
            list.innerHTML = '';
            products.forEach(p => {
                list.innerHTML += `<tr style="border-bottom:1px solid var(--border);">
                    <td style="padding:15px; font-weight:500;">${p.name}</td>
                    <td style="padding:15px; color:var(--text-muted);">${p.buyPrice} ₽</td>
                    <td style="padding:15px; color:#2ed573;">${p.sellPrice} ₽</td>
                    <td style="padding:15px;">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <button class="btn-danger" style="padding:4px 10px;" onclick="changeProductCount('${p.id}',-1)">−</button>
                            <span>${p.count}</span>
                            <button class="btn" style="padding:4px 10px;width:auto;" onclick="changeProductCount('${p.id}',1)">+</button>
                        </div>
                    </td>
                    <td style="padding:15px;">
                        <button class="btn-danger" onclick="deleteProduct('${p.id}')">Удалить</button>
                    </td>
                </tr>`;
            });
        }

        async function addNewProduct() {
            const name = document.getElementById('add_prod_name').value.trim();
            const buy = parseInt(document.getElementById('add_prod_buy').value) || 0;
            const sell = parseInt(document.getElementById('add_prod_sell').value) || 0;
            const cnt = parseInt(document.getElementById('add_prod_cnt').value) || 0;
            if (!name) return alert('Введите название товара!');
            const newP = { id: 'p_' + Date.now(), name, buyPrice: buy, sellPrice: sell, count: cnt };
            store.products.push(newP);
            await window.appDB.saveProducts(store.products);
            document.getElementById('add_prod_name').value = '';
            document.getElementById('add_prod_buy').value = '';
            document.getElementById('add_prod_sell').value = '';
            document.getElementById('add_prod_cnt').value = '';
            renderProductsList(store.products);
        }

        async function deleteProduct(id) {
            showCustomConfirm('Удалить товар?', async () => {
                store.products = store.products.filter(p => p.id !== id);
                await window.appDB.saveProducts(store.products);
                renderProductsList(store.products);
            });
        }

        function renderSalaries(bookings, masters) {
            const list = document.getElementById('admin-salaries-list');
            if(!list) return;
            list.innerHTML = '';
            
            let mRev = {};
            masters.forEach(m => mRev[m.id] = { total: 0, salary: 0 });
            
            bookings.filter(b => b.status === 'completed').forEach(b => {
                let mId = (b.masterId === 'any' || !b.masterId) ? 'any' : b.masterId;
                if(mId !== 'any' && mRev[mId]) {
                    let val = parseInt(b.price || 0);
                    mRev[mId].total += val;
                    let share = masters.find(m => m.id === mId).share || 50;
                    mRev[mId].salary += val * (share / 100);
                }
            });

            let grandTotal = 0, grandSalary = 0;
            masters.forEach(m => {
                let share = m.share || 50;
                let total = mRev[m.id].total;
                let salary = Math.round(mRev[m.id].salary);
                let salon = total - salary;
                grandTotal += total; grandSalary += salary;
                list.innerHTML += `<tr>
                    <td style="padding:15px; border-bottom:1px solid var(--border);">${m.name}</td>
                    <td style="padding:15px; border-bottom:1px solid var(--border); color:var(--text-muted);">${share}%</td>
                    <td style="padding:15px; border-bottom:1px solid var(--border);">${total} ₽</td>
                    <td style="padding:15px; border-bottom:1px solid var(--border); color:#2ed573; font-weight:600;">${salary} ₽</td>
                    <td style="padding:15px; border-bottom:1px solid var(--border); color:var(--accent); font-weight:600;">${salon} ₽</td>
                </tr>`;
            });
            const tfoot = document.getElementById('admin-salaries-total');
            if (tfoot) tfoot.innerHTML = `<tr>
                <td style="padding:15px;" colspan="2">Итого</td>
                <td style="padding:15px;">${grandTotal} ₽</td>
                <td style="padding:15px; color:#2ed573;">${grandSalary} ₽</td>
                <td style="padding:15px; color:var(--accent);">${grandTotal - grandSalary} ₽</td>
            </tr>`;
        }

        function renderAdminReviews(reviews) {
            const list = document.getElementById('admin-reviews-list');
            if(!list || !reviews) return;
            list.innerHTML = '';
            if(reviews.length === 0) { list.innerHTML = `<p class="empty-state">${adminI18n[currentAdminLang].msg_empty_rev}</p>`; return; }
            reviews.forEach(r => {
                list.innerHTML += `<div class="admin-card" style="margin-bottom:10px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <strong style="color:var(--accent);">${r.clientName || 'Аноним'}</strong>
                        <small style="color:var(--text-muted);">${r.date || ''}</small>
                    </div>
                    <p style="margin-bottom:8px;font-style:italic;">"${r.comment || ''}"</p>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <small style="color:var(--accent);">${'⭐'.repeat(parseInt(r.rating)||0)} (${r.masterName || ''})</small>
                        <button class="btn-danger" style="padding:4px 10px;" onclick="deleteReview('${r.id}')">Удалить</button>
                    </div>
                </div>`;
            });
        }

        async function deleteReview(id) {
            showCustomConfirm('Удалить этот отзыв?', async () => {
                store.reviews = store.reviews.filter(r => r.id !== id);
                await window.appDB.saveReviews(store.reviews);
                renderAdminReviews(store.reviews);
            });
        }

        function renderManualOptions(services, masters) {
            const mService = document.getElementById('manual_service');
            const mMaster = document.getElementById('manual_master');
            if(mService && services) {
                mService.innerHTML = '';
                services.forEach(s => mService.innerHTML += `<option value="${s.id}">${s.strings[currentAdminLang]?.title || s.strings.ru.title} - ${s.price} ₽</option>`);
            }
            if(mMaster && masters) {
                const anyStr = currentAdminLang === 'ru' ? 'Любой мастер' : (currentAdminLang === 'en' ? 'Any master' : (currentAdminLang === 'uz' ? 'Istalgan usta' : 'Каалаган чебер'));
                mMaster.innerHTML = `<option value="any">${anyStr}</option>`;
                masters.forEach(m => mMaster.innerHTML += `<option value="${m.id}">${m.name}</option>`);
            }
        }

        const DAY_LABELS = ['ВС','ПН','ВТ','СР','ЧТ','ПТ','СБ'];

        function handleMasterPhotoUpload(inputEl, targetId, previewId) {
            const file = inputEl.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const MAX = 300;
                    let w = img.width, h = img.height;
                    if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
                    else       { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    const base64 = canvas.toDataURL('image/jpeg', 0.82);
                    const target = document.getElementById(targetId);
                    if (target) target.value = base64;
                    const preview = document.getElementById(previewId);
                    if (preview) { preview.src = base64; preview.style.display = 'block'; }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function renderMastersList(masters) {
            const list = document.getElementById('admin-masters-list');
            if (!list || !masters) return;
            if (masters.length === 0) {
                list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Мастера ещё не добавлены</p>';
                return;
            }
            list.innerHTML = masters.map(m => {
                const isActive = m.active !== false;
                const borderColor = isActive ? 'var(--accent)' : 'var(--border)';
                const ava = m.photo
                    ? `<img src="${m.photo}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid ${borderColor};flex-shrink:0;">`
                    : `<div style="width:52px;height:52px;border-radius:50%;background:var(--overlay-mid);display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:bold;color:var(--accent);flex-shrink:0;border:2px solid ${borderColor};">${m.name.charAt(0).toUpperCase()}</div>`;

                const dayPills = DAY_LABELS.map((d, i) => {
                    const on = (m.workingDays || []).includes(i);
                    return `<span style="padding:2px 7px;border-radius:4px;font-size:0.72rem;font-weight:600;background:${on ? 'var(--accent)' : 'var(--overlay-mid)'};color:${on ? '#000' : 'var(--text-muted)'};">${d}</span>`;
                }).join('');

                const statusBadge = isActive
                    ? `<span style="background:rgba(46,213,115,0.15);color:#2ed573;padding:2px 9px;border-radius:10px;font-size:0.72rem;font-weight:600;">● Активен</span>`
                    : `<span style="background:rgba(255,100,100,0.15);color:#ff6464;padding:2px 9px;border-radius:10px;font-size:0.72rem;font-weight:600;">● Пауза</span>`;

                const editDays = DAY_LABELS.map((d, i) => {
                    const on = (m.workingDays || []).includes(i);
                    return `<label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:0.85rem;"><input type="checkbox" value="${i}" ${on ? 'checked' : ''} style="accent-color:var(--accent);"> ${d}</label>`;
                }).join('');

                return `
                <div class="card" style="margin-bottom:15px;opacity:${isActive ? '1' : '0.65'};transition:opacity .3s;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
                        <div style="display:flex;align-items:center;gap:14px;flex:1;min-width:0;">
                            ${ava}
                            <div style="min-width:0;">
                                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
                                    <h4 style="margin:0;">${m.name}</h4>
                                    ${statusBadge}
                                </div>
                                ${m.description ? `<p style="color:var(--text-muted);font-size:0.82rem;margin:0 0 7px;">${m.description}</p>` : ''}
                                <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:7px;">${dayPills}</div>
                                <small style="color:var(--text-muted);">Услуги: <b style="color:var(--accent)">${m.share}%</b> &nbsp;|&nbsp; Товары: <b style="color:var(--accent)">${m.productShare || 0}%</b></small>
                            </div>
                        </div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;flex-shrink:0;">
                            <button class="btn btn-outline" onclick="toggleMasterActive('${m.id}')" style="margin:0;padding:6px 12px;width:auto;font-size:0.8rem;">${isActive ? '⏸ Пауза' : '▶ Активировать'}</button>
                            <button class="btn btn-outline" onclick="toggleMasterEdit('${m.id}')" style="margin:0;padding:6px 12px;width:auto;font-size:0.8rem;">✏ Изменить</button>
                            <button class="btn-danger" onclick="deleteMaster('${m.id}')" style="padding:6px 12px;width:auto;font-size:0.8rem;">Удалить</button>
                        </div>
                    </div>
                    <div id="edit-form-${m.id}" style="display:none;margin-top:15px;padding-top:15px;border-top:1px solid var(--border);">
                        <div class="flex-row" style="margin-bottom:10px;">
                            <div class="form-group" style="margin:0;flex:2;">
                                <label style="display:block;margin-bottom:4px;font-size:0.8rem;color:var(--text-muted);">Имя</label>
                                <input type="text" id="edit_name_${m.id}" class="form-control" value="${m.name}">
                            </div>
                            <div class="form-group" style="margin:0;flex:1;">
                                <label style="display:block;margin-bottom:4px;font-size:0.8rem;color:var(--text-muted);">Доля услуги (%)</label>
                                <input type="number" id="edit_share_${m.id}" class="form-control" value="${m.share}">
                            </div>
                            <div class="form-group" style="margin:0;flex:1;">
                                <label style="display:block;margin-bottom:4px;font-size:0.8rem;color:var(--text-muted);">Доля товары (%)</label>
                                <input type="number" id="edit_pshare_${m.id}" class="form-control" value="${m.productShare || 0}">
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom:10px;">
                            <label style="display:block;margin-bottom:4px;font-size:0.8rem;color:var(--text-muted);">Специализация / описание</label>
                            <input type="text" id="edit_desc_${m.id}" class="form-control" value="${(m.description || '').replace(/"/g, '&quot;')}">
                        </div>
                        <div class="form-group" style="margin-bottom:10px;">
                            <label style="display:block;margin-bottom:4px;font-size:0.8rem;color:var(--text-muted);">Фото</label>
                            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                                <input type="text" id="edit_photo_${m.id}" class="form-control" value="${(m.photo || '').replace(/"/g, '&quot;')}" placeholder="Ссылка (URL)" style="flex:1;min-width:150px;">
                                <label class="btn btn-outline" style="margin:0;padding:8px 14px;width:auto;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;font-size:0.82rem;">
                                    📁 С ПК
                                    <input type="file" accept="image/*" style="display:none;" onchange="handleMasterPhotoUpload(this,'edit_photo_${m.id}','edit_preview_${m.id}')">
                                </label>
                            </div>
                            ${m.photo ? `<img id="edit_preview_${m.id}" src="${m.photo}" style="margin-top:8px;width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);">` : `<img id="edit_preview_${m.id}" style="display:none;margin-top:8px;width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);">`}
                        </div>
                        <div style="margin-bottom:12px;">
                            <label style="display:block;margin-bottom:8px;font-size:0.8rem;color:var(--text-muted);">Рабочие дни</label>
                            <div style="display:flex;gap:14px;flex-wrap:wrap;" id="edit_days_${m.id}">${editDays}</div>
                        </div>
                        <div style="display:flex;gap:8px;">
                            <button class="btn" onclick="saveMasterEdit('${m.id}')" style="padding:10px 22px;width:auto;font-size:0.85rem;">Сохранить</button>
                            <button class="btn btn-outline" onclick="toggleMasterEdit('${m.id}')" style="margin:0;padding:10px 22px;width:auto;font-size:0.85rem;">Отмена</button>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        function toggleMasterEdit(id) {
            const form = document.getElementById('edit-form-' + id);
            if (!form) return;
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        }

        async function toggleMasterActive(id) {
            const m = store.masters.find(x => x.id === id);
            if (!m) return;
            m.active = m.active === false ? true : false;
            await window.appDB.saveMasters(store.masters);
            renderMastersList(store.masters);
        }

        async function saveMasterEdit(id) {
            const m = store.masters.find(x => x.id === id);
            if (!m) return;
            const newName = document.getElementById('edit_name_' + id).value.trim();
            if (!newName) return alert('Имя не может быть пустым!');
            m.name = newName;
            m.share = parseInt(document.getElementById('edit_share_' + id).value) || 0;
            m.productShare = parseInt(document.getElementById('edit_pshare_' + id).value) || 0;
            m.description = document.getElementById('edit_desc_' + id).value.trim();
            m.photo = document.getElementById('edit_photo_' + id).value.trim();
            let days = [];
            document.querySelectorAll('#edit_days_' + id + ' input[type="checkbox"]:checked').forEach(el => days.push(parseInt(el.value)));
            if (days.length === 0) days = [1,2,3,4,5,6,0];
            m.workingDays = days;
            await window.appDB.saveMasters(store.masters);
            renderMastersList(store.masters);
            renderManualOptions(store.services, store.masters);
        }

        async function addMaster() {
            const nameEl = document.getElementById('new_master_name');
            const shareEl = document.getElementById('new_master_share');
            const pShareEl = document.getElementById('new_master_product_share');
            const photoEl = document.getElementById('new_master_photo');
            const descEl = document.getElementById('new_master_desc');

            const name = nameEl.value.trim();
            const share = parseInt(shareEl.value || 50);
            const pShare = parseInt(pShareEl.value || 10);
            const photoUrl = photoEl.value.trim();
            const desc = descEl ? descEl.value.trim() : '';

            if (!name) return alert('Введите имя мастера!');

            let days = [];
            document.querySelectorAll('#new_master_days input[type="checkbox"]:checked').forEach(el => days.push(parseInt(el.value)));
            if (days.length === 0) days = [1,2,3,4,5,6,0];

            const m = { id: 'm_' + Date.now(), name, share, productShare: pShare, photo: photoUrl, description: desc, workingDays: days, active: true };
            store.masters.push(m);
            await window.appDB.saveMasters(store.masters);

            nameEl.value = ''; shareEl.value = '50'; pShareEl.value = '10'; photoEl.value = '';
            if (descEl) descEl.value = '';
            const prev = document.getElementById('new_master_preview');
            if (prev) { prev.src = ''; prev.style.display = 'none'; }
            document.querySelectorAll('#new_master_days input[type="checkbox"]').forEach(el => el.checked = true);

            renderMastersList(store.masters);
            renderManualOptions(store.services, store.masters);
        }

        async function deleteMaster(id) {
            showCustomConfirm('Вы уверены, что хотите удалить этого мастера?', async () => {
                store.masters = store.masters.filter(m => m.id !== id);
                await window.appDB.saveMasters(store.masters);
                renderMastersList(store.masters);
                renderManualOptions(store.services, store.masters);
            });
        }

        async function updateBookingStatus(id, newStatus) {
            let b = store.bookings.find(x => x.id === id);
            if(b) {
                b.status = newStatus;
                await window.appDB.saveBookings(store.bookings);
                renderCalendarGrid(store.bookings);
                renderCharts(store.bookings); // Refresh stats
            }
        }

        async function deleteBooking(id) {
            showCustomConfirm('Точно удалить запись? Это действие необратимо.', async () => {
                store.bookings = store.bookings.filter(b => b.id !== id);
                await window.appDB.saveBookings(store.bookings);
                renderCalendarGrid(store.bookings);
                if(typeof renderAdminBookings === 'function') renderAdminBookings(store.bookings);
                renderCharts(store.bookings);
            });
        }

        async function addManualBooking() {
            let name = document.getElementById('manual_client_name').value.trim();
            let phone = document.getElementById('manual_client_phone').value.trim();
            let date = document.getElementById('manual_date').value;
            let time = document.getElementById('manual_time').value;
            let servId = document.getElementById('manual_service').value;
            let mastId = document.getElementById('manual_master').value;

            if(!name || !time || !date) return alert('Введите имя, дату и время!');

            let srv = store.services.find(s => s.id === servId);
            let srvName = srv ? srv.strings.ru.title : '';
            let srvPrice = srv ? srv.price : 0;
            
            let mObj = store.masters.find(m => m.id === mastId);
            let mName = mObj ? mObj.name : 'Любой';

            let newBooking = {
                id: 'b_' + Date.now(),
                date: date,
                time: time,
                name: name,
                phone: phone,
                serviceKey: servId,
                service: srvName,
                price: srvPrice,
                masterId: mastId,
                masterName: mName,
                status: 'pending',
                timestamp: new Date().toISOString()
            };

            try {
                const result = await window.appDB.commitNewBooking(newBooking, {
                    masters: store.masters,
                    services: store.services,
                    settings: store.settings
                });
                store.bookings = result.items;
            } catch (e) {
                alert(e.message || 'Этот слот уже занят или данные некорректны.');
                return;
            }

            // Clear inputs
            document.getElementById('manual_client_name').value = '';
            document.getElementById('manual_client_phone').value = '';
            
            alert('Ручная запись успешно добавлена!');
            renderCalendarGrid(store.bookings);
            renderCharts(store.bookings);
        }

        function fastBook(time, masterId) {
            document.getElementById('manual_date').value = new Date().toISOString().split('T')[0];
            document.getElementById('manual_time').value = time;
            document.getElementById('manual_master').value = masterId;
            document.getElementById('manual_client_name').focus();
            // Скроллим до формы (если нужно)
            document.getElementById('manual_client_name').scrollIntoView({behavior: "smooth", block: "center"});
        }

        // Fallback for document load (already handled by initAdmin but explicitly just in case)
        if(typeof initAdmin === 'undefined') document.addEventListener('DOMContentLoaded', () => { changeLanguage(currentLang); loadAdminData(); });


