/* ============================================
   API ROUTES
   All API endpoints organized in modules
   ============================================ */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const {
    addTestDrive,
    addContact,
    addNewsletter,
    getAnalytics,
    getAllTestDrives,
    getAllContacts
} = require('../utils/database');
const {
    validateTestDriveRequest,
    validateContactRequest,
    validateNewsletterEmail,
    sanitizeTestDriveData,
    sanitizeContactData,
    sanitizeEmail
} = require('../utils/validation');

const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../Web_project/data');

// ===== CARS ENDPOINTS =====

/**
 * GET /api/cars
 * Returns all available car models
 */
router.get('/cars', async (req, res) => {
    try {
        const carDataPath = path.join(DATA_PATH, 'car.json');
        const data = await fs.readFile(carDataPath, 'utf8');
        
        res.header('Content-Type', 'application/json');
        res.send(data);
    } catch (error) {
        console.error('[API] Error reading cars:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error loading car data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ===== TEST DRIVE ENDPOINTS =====

/**
 * POST /api/testdrive
 * Create a new test drive request
 */
router.post('/testdrive', async (req, res) => {
    try {
        const { name, email, phone, model, date, message } = req.body;

        // Validace
        const validation = validateTestDriveRequest({ name, email, phone, model, message });
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Validace selhala',
                errors: validation.errors
            });
        }

        // Sanitizace dat
        const sanitized = sanitizeTestDriveData({ name, email, phone, model, message, date });

        // Uložení do "databáze" (funkce addTestDrive)
        const record = await addTestDrive(sanitized);

        res.status(201).json({
            success: true,
            message: 'Žádost o testovací jízdu vytvořena',
            id: record.id
        });
    } catch (error) {
        console.error('[API] Error creating test drive:', error.message);
        res.status(500).json({
            success: false,
            message: 'Chyba serveru',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/testdrive
 * Get all test drive requests (admin only)
 */
router.get('/testdrive/cars', async (req, res) => {
    try {
        const carDataPath = path.join(DATA_PATH, 'cars-offer.json'); // cesta k JSON
        const data = await fs.readFile(carDataPath, 'utf8');

        res.header('Content-Type', 'application/json');
        res.send(data);
    } catch (error) {
        console.error('[API] Error reading cars-offer.json:', error.message);
        res.status(500).json({
            success: false,
            message: 'Chyba při načítání nabídky aut pro testovací jízdu',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// ===== CONTACT ENDPOINTS =====

/**
 * POST /api/contact
 * Create a new contact message
 */
router.post('/contact', async (req, res) => {
    try {
        const { name, email, phone, model, message } = req.body;

        // Validate input
        const validation = validateContactRequest({ name, email, phone, model, message });
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // Sanitize data
        const sanitized = sanitizeContactData({ name, email, phone, model, message });

        // Save to database
        const record = await addContact(sanitized);

        res.status(201).json({
            success: true,
            message: 'Contact message sent successfully',
            id: record.id
        });
    } catch (error) {
        console.error('[API] Error creating contact:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/contact
 * Get all contact messages (admin only)
 */
router.get('/contact', async (req, res) => {
    try {
        // In production, you'd check auth here
        const limit = parseInt(req.query.limit) || null;
        const contacts = await getAllContacts(limit);

        res.json({
            success: true,
            count: contacts.length,
            data: contacts
        });
    } catch (error) {
        console.error('[API] Error fetching contacts:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ===== NEWSLETTER ENDPOINTS =====

/**
 * POST /api/newsletter
 * Subscribe to newsletter
 */
router.post('/newsletter', async (req, res) => {
    try {
        const { email } = req.body;

        // Validate
        if (!email || !validateNewsletterEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            });
        }

        // Sanitize
        const sanitizedEmail = sanitizeEmail(email);

        // Subscribe
        const result = await addNewsletter(sanitizedEmail);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(201).json({
            success: true,
            message: 'Successfully subscribed to newsletter'
        });
    } catch (error) {
        console.error('[API] Error subscribing to newsletter:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ===== COOKIES ENDPOINTS =====

/**
 * POST /api/cookies
 * Save user cookies preferences
 */
router.post('/cookies', async (req, res) => {
    try {
        const { allowed, sessionId } = req.body;

        // Basic validation
        if (allowed === undefined && allowed === null) {
            return res.status(400).json({
                success: false,
                message: 'Cookies preference (allowed) is required'
            });
        }

        // Get database
        const { readDatabase, writeDatabase } = require('../utils/database');
        const db = await readDatabase();

        // Create cookie preference record
        const cookieRecord = {
            id: require('../utils/database').generateId(),
            sessionId: sessionId || 'anonymous',
            allowed: allowed === true,
            timestamp: new Date().toISOString()
        };

        // Initialize cookies array if it doesn't exist
        if (!db.cookies) {
            db.cookies = [];
        }

        db.cookies.push(cookieRecord);
        await writeDatabase(db);

        res.status(200).json({
            success: true,
            message: 'Cookie preference saved successfully'
        });
    } catch (error) {
        console.error('[API] Error saving cookie preference:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ===== ANALYTICS ENDPOINTS =====

/**
 * GET /api/analytics
 * Get analytics data (admin only)
 */
router.get('/analytics', async (req, res) => {
    try {
        // In production, you'd check auth here
        const analytics = await getAnalytics();

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('[API] Error fetching analytics:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ===== HEALTH CHECK =====

/**
 * GET /api/health
 * Server health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
