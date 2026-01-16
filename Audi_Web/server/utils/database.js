/* ============================================
   DATABASE UTILITIES
   Helper functions for database operations
   ============================================ */

const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(__dirname, '../database.json');

/**
 * Read the entire database
 */
async function readDatabase() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('[DB] Error reading database:', error.message);
        return getEmptyDatabase();
    }
}

/**
 * Write the entire database
 */
async function writeDatabase(data) {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('[DB] Error writing database:', error.message);
        return false;
    }
}

/**
 * Get empty database structure
 */
function getEmptyDatabase() {
    return {
        testdrives: [],
        contacts: [],
        newsletter: [],
        analytics: {
            pageViews: 0,
            totalTestDrives: 0,
            totalContacts: 0,
            totalNewsletter: 0,
            visitorsCount: 0,
            lastUpdated: new Date().toISOString()
        },
        users: []
    };
}

/**
 * Add a test drive record
 */
async function addTestDrive(testDriveData) {
    const db = await readDatabase();
    
    const newRecord = {
        id: generateId(),
        ...testDriveData,
        createdAt: new Date().toISOString(),
        status: 'pending'
    };
    
    db.testdrives.push(newRecord);
    db.analytics.totalTestDrives = db.testdrives.length;
    db.analytics.lastUpdated = new Date().toISOString();
    
    await writeDatabase(db);
    return newRecord;
}

/**
 * Add a contact record
 */
async function addContact(contactData) {
    const db = await readDatabase();
    
    const newRecord = {
        id: generateId(),
        ...contactData,
        createdAt: new Date().toISOString(),
        status: 'new',
        read: false
    };
    
    db.contacts.push(newRecord);
    db.analytics.totalContacts = db.contacts.length;
    db.analytics.lastUpdated = new Date().toISOString();
    
    await writeDatabase(db);
    return newRecord;
}

/**
 * Add a newsletter subscription
 */
async function addNewsletter(email) {
    const db = await readDatabase();
    
    // Check if already subscribed
    const exists = db.newsletter.some(sub => sub.email === email);
    if (exists) {
        return { success: false, message: 'Already subscribed' };
    }
    
    const newSubscription = {
        id: generateId(),
        email,
        subscribedAt: new Date().toISOString(),
        active: true
    };
    
    db.newsletter.push(newSubscription);
    db.analytics.totalNewsletter = db.newsletter.length;
    db.analytics.lastUpdated = new Date().toISOString();
    
    await writeDatabase(db);
    return { success: true, subscription: newSubscription };
}

/**
 * Update analytics
 */
async function updateAnalytics(updates) {
    const db = await readDatabase();
    
    db.analytics = {
        ...db.analytics,
        ...updates,
        lastUpdated: new Date().toISOString()
    };
    
    await writeDatabase(db);
    return db.analytics;
}

/**
 * Get all test drives
 */
async function getAllTestDrives(limit = null) {
    const db = await readDatabase();
    const sorted = db.testdrives.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * Get all contacts
 */
async function getAllContacts(limit = null) {
    const db = await readDatabase();
    const sorted = db.contacts.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * Get analytics
 */
async function getAnalytics() {
    const db = await readDatabase();
    return db.analytics;
}

/**
 * Generate unique ID
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate UUID v4
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

module.exports = {
    readDatabase,
    writeDatabase,
    getEmptyDatabase,
    addTestDrive,
    addContact,
    addNewsletter,
    updateAnalytics,
    getAllTestDrives,
    getAllContacts,
    getAnalytics,
    generateId,
    generateUUID
};
