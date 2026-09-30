// --- DATABASE MOCK (LocalStorage) ---
        const DB_BOOKINGS = 'barber_bookings';
        const DB_DISABLED_DATES = 'barber_disabled_dates';
        const DB_DISABLED_TIMES = 'barber_disabled_times';

        function getDB(key) { return JSON.parse(localStorage.getItem(key)) || []; }
        function saveDB(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

        // --- APP STATE ---
        let currentStep = 1;
        let bookingData = {
            id: null,
            service: null,
            price: null,
            date: null,
            time: null,
            name: '',
            phone: '',
            timestamp: null
        };

        const availableTimes = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

        // --- CLIENT LOGIC ---

        function selectService(name, price) {
            bookingData.service = name;
            bookingData.price = price;
            
            document.querySelectorAll('.service-card').forEach(card => card.classList.remove('selected'));
            event.currentTarget.classList.add('selected');
            
            document.getElementById('btn-next-1').disabled = false;
        }

        function nextStep(step) {
            document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
            document.getElementById(`step-${step}`).classList.add('active');
            
            document.querySelectorAll('.step').forEach(el => {
                let s = parseInt(el.dataset.step);
                el.classList.remove('active', 'completed');
                if (s < step) el.classList.add('completed');
                if (s === step) el.classList.add('active');
            });

            currentStep = step;

            if (step === 2) {
                renderDates();
            }
            if (step === 3) {
                document.getElementById('summary-service').innerText = `${bookingData.service} (${bookingData.price} ₽)`;
                
                // Format Date nicely
                const d = new Date(bookingData.date);
                const options = { day: 'numeric', month: 'long' };
                const formattedDate = d.toLocaleDateString('ru-RU', options);
                
                document.getElementById('summary-datetime').innerText = `${formattedDate} в ${bookingData.time}`;
            }
        }

        function renderDates() {
            const container = document.getElementById('dates-container');
            container.innerHTML = '';
            
            const today = new Date();
            const disabledDates = getDB(DB_DISABLED_DATES);

            for(let i=0; i<14; i++) {
                let d = new Date(today);
                d.setDate(d.getDate() + i);
                
                let isoDate = d.toISOString().split('T')[0];
                let dayName = d.toLocaleDateString('ru-RU', { weekday: 'short' });
                let dayNum = d.getDate();

                let isDateDisabled = disabledDates.includes(isoDate);

                let card = document.createElement('div');
                card.className = `date-card ${isDateDisabled ? 'disabled' : ''}`;
                card.innerHTML = `<div class="day">${dayName}</div><div class="num">${dayNum}</div>`;
                
                if (!isDateDisabled) {
                    card.onclick = () => selectDate(isoDate, card);
                }
                
                // Keep selected state if going back
                if (bookingData.date === isoDate) {
                    card.classList.add('selected');
                    selectDate(isoDate, card);
                }

                container.appendChild(card);
            }
        }

        function selectDate(isoDate, element) {
            bookingData.date = isoDate;
            bookingData.time = null; // reset time
            
            document.querySelectorAll('.date-card').forEach(c => c.classList.remove('selected'));
            element.classList.add('selected');

            document.getElementById('btn-next-2').disabled = true;
            renderTimes();
        }

        function renderTimes() {
            const container = document.getElementById('times-container');
            const picker = document.getElementById('time-picker');
            container.innerHTML = '';
            picker.style.display = 'block';

            const allBookings = getDB(DB_BOOKINGS);
            const disabledTimes = getDB(DB_DISABLED_TIMES);

            availableTimes.forEach(time => {
                // Check if booked
                let isBooked = allBookings.some(b => b.date === bookingData.date && b.time === time);
                // Check if admin disabled
                let slotKey = `${bookingData.date}_${time}`;
                let isAdminDisabled = disabledTimes.includes(slotKey);

                let disabled = isBooked || isAdminDisabled;

                let slot = document.createElement('div');
                slot.className = `time-slot ${disabled ? 'disabled' : ''}`;
                slot.innerText = time;

                if (!disabled) {
                    slot.onclick = () => selectTime(time, slot);
                }

                if (bookingData.time === time) {
                    slot.classList.add('selected');
                }

                container.appendChild(slot);
            });
        }

        function selectTime(time, element) {
            bookingData.time = time;
            document.querySelectorAll('.time-slot').forEach(c => c.classList.remove('selected'));
            element.classList.add('selected');
            document.getElementById('btn-next-2').disabled = false;
        }

        function validateForm() {
            bookingData.name = document.getElementById('client-name').value;
            bookingData.phone = document.getElementById('client-phone').value;

            let valid = bookingData.name.trim().length > 2 && bookingData.phone.trim().length > 6;
            document.getElementById('btn-submit').disabled = !valid;
        }

        function submitBooking() {
            let allBookings = getDB(DB_BOOKINGS);
            
            bookingData.id = Date.now().toString();
            bookingData.timestamp = new Date().toISOString();
            
            allBookings.push(bookingData);
            saveDB(DB_BOOKINGS, allBookings);

            // Show success
            document.getElementById('stepper').style.display = 'none';
            document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
            document.getElementById('step-success').classList.add('active');
        }

        // --- ADMIN LOGIC ---

        function promptAdmin() {
            let pass = prompt("Введите пароль:");
            if(pass === "1234") {
                document.getElementById('client-view').classList.remove('active');
                document.getElementById('admin-view').classList.add('active');
                document.getElementById('admin-trigger').style.display = 'none';
                loadAdminData();
            } else if(pass !== null) {
                alert("Неверный пароль");
            }
        }

        function logoutAdmin() {
            document.getElementById('admin-view').classList.remove('active');
            document.getElementById('client-view').classList.add('active');
            document.getElementById('admin-trigger').style.display = 'block';
            // reset client state on logout
            location.reload(); 
        }

        function switchAdminTab(tabName, element) {
            document.querySelectorAll('.admin-header .tab').forEach(t => t.classList.remove('active'));
            element.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`admin-tab-${tabName}`).classList.add('active');
        }

        function loadAdminData() {
            // Load Bookings
            const list = document.getElementById('admin-bookings-list');
            let bookings = getDB(DB_BOOKINGS);
            
            // Sort bookings latest first or by date
            bookings.sort((a,b) => new Date(a.date) - new Date(b.date));

            list.innerHTML = '';
            if(bookings.length === 0) {
                list.innerHTML = '<div class="empty-state">Пока нет ни одной записи.</div>';
            } else {
                bookings.forEach(b => {
                    list.innerHTML += `
                        <div class="booking-item">
                            <div class="booking-details">
                                <h4>${b.date} в ${b.time}</h4>
                                <p><strong style="color:#fff;">КЛИЕНТ:</strong> ${b.name} (${b.phone})</p>
                                <p><strong style="color:#fff;">УСЛУГА:</strong> ${b.service} - ${b.price} ₽</p>
                            </div>
                            <button class="btn btn-danger" onclick="deleteBooking('${b.id}')">Удалить</button>
                        </div>
                    `;
                });
            }

            // Load settings labels
            renderDisabledSettings();
        }

        function deleteBooking(id) {
            if(confirm("Вы уверены что хотите удалить эту запись?")) {
                let bookings = getDB(DB_BOOKINGS).filter(b => b.id !== id);
                saveDB(DB_BOOKINGS, bookings);
                loadAdminData();
            }
        }

        function renderDisabledSettings() {
            const dDates = getDB(DB_DISABLED_DATES);
            const dTimes = getDB(DB_DISABLED_TIMES);

            const datesCont = document.getElementById('disabled-dates-list');
            datesCont.innerHTML = dDates.map(d => `<span class="tag">${d} <button onclick="removeDisabledDate('${d}')">&times;</button></span>`).join('');

            const timesCont = document.getElementById('disabled-times-list');
            timesCont.innerHTML = dTimes.map(t => {
                let [date, time] = t.split('_');
                return `<span class="tag">${date} в ${time} <button onclick="removeDisabledTime('${t}')">&times;</button></span>`;
            }).join('');
        }

        function addDisabledDate() {
            let val = document.getElementById('disable-date-input').value;
            if(!val) return;
            let arr = getDB(DB_DISABLED_DATES);
            if(!arr.includes(val)) {
                arr.push(val);
                saveDB(DB_DISABLED_DATES, arr);
                renderDisabledSettings();
                document.getElementById('disable-date-input').value = '';
            }
        }

        function removeDisabledDate(val) {
            let arr = getDB(DB_DISABLED_DATES).filter(d => d !== val);
            saveDB(DB_DISABLED_DATES, arr);
            renderDisabledSettings();
        }

        function addDisabledTime() {
            let d = document.getElementById('disable-slot-date').value;
            let t = document.getElementById('disable-slot-time').value;
            if(!d || !t) return;
            let key = `${d}_${t}`;
            
            let arr = getDB(DB_DISABLED_TIMES);
            if(!arr.includes(key)) {
                arr.push(key);
                saveDB(DB_DISABLED_TIMES, arr);
                renderDisabledSettings();
            }
        }

        function removeDisabledTime(val) {
            let arr = getDB(DB_DISABLED_TIMES).filter(d => d !== val);
            saveDB(DB_DISABLED_TIMES, arr);
            renderDisabledSettings();
        }
