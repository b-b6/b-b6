const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize SQLite Database (NoSQL-like structure for quick migration)
const db = new sqlite3.Database('./saas.db', (err) => {
    if (err) console.error('DB Connection error:', err.message);
    else console.log('Connected to SQLite Database.');
});

db.run(`CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    collection_name TEXT,
    data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Telegram Bot Setup (Replace with your actual bot token to enable notifications)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN_HERE';
let bot = null;
if (TELEGRAM_BOT_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
}

// 1. GET documents by collection and tenant
app.get('/api/data/:tenant/:collection', (req, res) => {
    const { tenant, collection } = req.params;
    db.all(`SELECT id, data FROM documents WHERE tenant_id = ? AND collection_name = ?`, [tenant, collection], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const result = rows.map(r => ({ id: r.id, ...JSON.parse(r.data) }));
        res.json(result);
    });
});

// 2. POST document (Save data)
app.post('/api/data/:tenant/:collection', (req, res) => {
    const { tenant, collection } = req.params;
    const body = req.body;
    const id = body.id || Date.now().toString();
    const dataStr = JSON.stringify(body);

    db.run(`INSERT OR REPLACE INTO documents (id, tenant_id, collection_name, data) VALUES (?, ?, ?, ?)`,
        [id, tenant, collection, dataStr],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // 3. Trigger Telegram Notification if this is a new booking
            if (collection === 'barber_bookings') {
                sendTelegramNotification(tenant, body);
            }
            
            res.json({ success: true, id });
        }
    );
});

// Function to send notifications
function sendTelegramNotification(tenantId, bookingData) {
    if (!bot) {
        console.log(`[Mock Notification] New booking for ${tenantId}:`, bookingData);
        return;
    }
    
    // In a real app, you would fetch the Admin's Telegram Chat ID from the DB based on tenantId
    // For now, we print it or send to a test group if hardcoded.
    // const adminChatId = "GET_FROM_DB";
    // const msg = `🔔 Новая запись!\nБарбершоп: ${tenantId}\nИмя: ${bookingData.clientName}\nУслуга: ${bookingData.serviceName}\nВремя: ${bookingData.date} ${bookingData.time}`;
    // bot.sendMessage(adminChatId, msg).catch(err => console.error(err));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`SaaS Backend running on http://localhost:${PORT}`);
    console.log(`Multi-tenancy enabled. Waiting for requests...`);
});
