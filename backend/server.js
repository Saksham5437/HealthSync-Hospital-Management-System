const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });
require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const billingRoutes = require('./routes/billingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
].filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.some((o) => origin === o || origin.endsWith('.vercel.app'))) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
}));
app.use(express.json());

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: 'Invalid JSON request body' });
    }
    return next(err);
});

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('HealthSync Backend Running');
});

app.get('/api/health', (req, res) => {
    const db = require('./config/db');
    db.query('SELECT 1 AS ok', (err) => {
        if (err) {
            return res.status(503).json({
                status: 'error',
                message: 'Database not connected',
                detail: err.message,
            });
        }
        res.json({
            status: 'ok',
            service: 'HealthSync API',
            database: 'connected',
        });
    });
});

const PORT = process.env.PORT || 5000;

const logDatabaseStatus = () => {
    const db = require('./config/db');
    const { getConfigSummary } = require('./config/db');
    const summary = getConfigSummary();

    console.log(`Database config: ${summary.mode} | host=${summary.host} | db=${summary.database} | ssl=${summary.ssl}`);

    db.query('SELECT 1 AS ok', (err) => {
        if (err) {
            console.error('Database connection failed:', err.message);
            console.error('Fix DB_* env vars on Render (see DEPLOYMENT.md → Aiven section).');
        } else {
            console.log('Database connection: OK');
        }
    });
};

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    logDatabaseStatus();
});

module.exports = { app, server };
