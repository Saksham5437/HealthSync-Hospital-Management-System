const db = require('../config/db');
const bcrypt = require('bcryptjs');

const loginRoles = ['patient', 'doctor', 'admin'];
const registerRoles = ['patient', 'doctor'];
const requiredDbEnv = ['DB_HOST', 'DB_USER', 'DB_NAME'];

const getDbConfigError = () => {
    const missing = requiredDbEnv.filter((key) => !process.env[key]);
    return missing.length
        ? `Database is not configured. Missing: ${missing.join(', ')}`
        : null;
};

const query = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });

const getConnection = () =>
    new Promise((resolve, reject) => {
        db.getConnection((err, connection) => {
            if (err) reject(err);
            else resolve(connection);
        });
    });

const run = (connection, sql, params = []) =>
    new Promise((resolve, reject) => {
        connection.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });

const begin = (connection) =>
    new Promise((resolve, reject) => {
        connection.beginTransaction((err) => err ? reject(err) : resolve());
    });

const commit = (connection) =>
    new Promise((resolve, reject) => {
        connection.commit((err) => err ? reject(err) : resolve());
    });

const rollback = (connection) =>
    new Promise((resolve) => {
        connection.rollback(() => resolve());
    });

const getColumns = async (tableName) => {
    const columns = await query(`SHOW COLUMNS FROM ${tableName}`);
    return columns.reduce((map, column) => {
        map[column.Field] = column;
        return map;
    }, {});
};

const normalizeRole = (role) => String(role || '').toLowerCase();
const normalizeUsername = (username) => String(username || '').trim();
const isHashedPassword = (passwordHash = '') => /^\$2[aby]\$/.test(passwordHash);

const buildUserPayload = (columns, { username, passwordHash, fullName, role }) => {
    const payload = {
        full_name: fullName,
        role,
        password_hash: passwordHash,
    };

    if (columns.username) payload.username = username;
    if (columns.email) payload.email = username;

    return payload;
};

const getDepartmentId = async (connection) => {
    try {
        const departments = await run(
            connection,
            'SELECT department_id FROM departments ORDER BY department_id LIMIT 1'
        );

        if (departments.length > 0) {
            return departments[0].department_id;
        }

        const columns = await getColumns('departments');

        if (columns.department_name) {
            const result = await run(
                connection,
                'INSERT INTO departments (department_name) VALUES (?)',
                ['General Medicine']
            );
            return result.insertId;
        }
    } catch (err) {
        console.warn('Unable to resolve default department:', err.message);
    }

    return 1;
};

const insertProfile = async (connection, role, userId) => {
    const tableName = role === 'patient' ? 'patient_profiles' : 'doctor_profiles';
    const columns = await getColumns(tableName);
    const payload = { user_id: userId };

    if (role === 'doctor') {
        if (columns.department_id) payload.department_id = await getDepartmentId(connection);
        if (columns.specialization) payload.specialization = 'General Medicine';
        if (columns.experience_years) payload.experience_years = 0;
        if (columns.qualification) payload.qualification = 'Pending verification';
        if (columns.consultation_fee) payload.consultation_fee = 0;
        if (columns.availability_status) payload.availability_status = 'available';
    }

    const fields = Object.keys(payload);
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map((field) => payload[field]);
    const result = await run(
        connection,
        `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`,
        values
    );

    return result.insertId;
};

const getUserByUsername = async (username) => {
    const userColumns = await getColumns('system_users');
    const usernameCondition = userColumns.username
        ? '(su.username = ? OR su.email = ?)'
        : 'su.email = ?';
    const params = userColumns.username ? [username, username] : [username];

    const sql = `
        SELECT
            su.user_id,
            su.full_name,
            ${userColumns.username ? 'su.username,' : 'su.email AS username,'}
            su.email,
            su.role,
            su.password_hash,
            pp.patient_id,
            dp.doctor_id
        FROM system_users su
        LEFT JOIN patient_profiles pp ON su.user_id = pp.user_id
        LEFT JOIN doctor_profiles dp ON su.user_id = dp.user_id
        WHERE ${usernameCondition}
        LIMIT 1
    `;

    const results = await query(sql, params);
    return results[0];
};

const serializeUser = (user) => {
    const profileId =
        user.role === 'patient' ? user.patient_id :
        user.role === 'doctor' ? user.doctor_id :
        user.user_id;

    return {
        id: profileId,
        profileId,
        systemUserId: user.user_id,
        name: user.full_name,
        username: user.username || user.email,
        email: user.email,
        role: user.role
    };
};

const loginUser = async (req, res) => {
    const username = normalizeUsername(req.body.username || req.body.email);
    const { password } = req.body;
    const role = normalizeRole(req.body.role);

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    if (!loginRoles.includes(role)) {
        return res.status(400).json({ message: 'Select patient, doctor, or admin account type' });
    }

    try {
        const user = await getUserByUsername(username);

        if (!user || user.role !== role) {
            return res.status(401).json({ message: 'Invalid userid or password' });
        }

        const passwordMatches = isHashedPassword(user.password_hash)
            ? bcrypt.compareSync(password, user.password_hash)
            : password === user.password_hash;

        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid userid or password' });
        }

        if (user.role === 'patient' && !user.patient_id) {
            return res.status(409).json({ message: 'Patient profile is missing for this account' });
        }

        if (user.role === 'doctor' && !user.doctor_id) {
            return res.status(409).json({ message: 'Doctor profile is missing for this account' });
        }

        return res.json({
            message: 'Login successful',
            user: serializeUser(user)
        });
    } catch (err) {
        console.error('Login failed:', err);
        return res.status(500).json({
            message: getDbConfigError() || 'Unable to sign in right now. Please check the database connection.'
        });
    }
};

const registerUser = async (req, res) => {
    const username = normalizeUsername(req.body.username || req.body.email);
    const password = String(req.body.password || '');
    const fullName = String(req.body.fullName || req.body.name || username).trim();
    const role = normalizeRole(req.body.role);

    if (!username || !password || !fullName) {
        return res.status(400).json({ message: 'Full name, username and password are required' });
    }

    if (username.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!registerRoles.includes(role)) {
        return res.status(400).json({ message: 'Only patient and doctor accounts can register here' });
    }

    let connection;

    try {
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        connection = await getConnection();
        await begin(connection);

        const userColumns = await getColumns('system_users');
        const passwordHash = bcrypt.hashSync(password, 10);
        const payload = buildUserPayload(userColumns, { username, passwordHash, fullName, role });
        const fields = Object.keys(payload);
        const placeholders = fields.map(() => '?').join(', ');
        const values = fields.map((field) => payload[field]);
        const userResult = await run(
            connection,
            `INSERT INTO system_users (${fields.join(', ')}) VALUES (${placeholders})`,
            values
        );
        const userId = userResult.insertId;
        const profileId = await insertProfile(connection, role, userId);

        await commit(connection);

        return res.status(201).json({
            message: 'Registration successful',
            user: {
                id: profileId,
                profileId,
                systemUserId: userId,
                name: fullName,
                username,
                email: userColumns.email ? username : undefined,
                role
            }
        });
    } catch (err) {
        if (connection) await rollback(connection);
        console.error('Registration failed:', err);
        return res.status(500).json({
            message: getDbConfigError() || 'Unable to register right now. Please check the database schema and connection.'
        });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { loginUser, registerUser };
