/* ============================================
   VALIDATION UTILITIES
   Input validation and sanitization
   ============================================ */

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone format (Czech standard)
 */
function isValidPhone(phone) {
    // Basic validation - at least 9 digits
    const phoneRegex = /^[\d\s\+\-\(\)]{9,}$/;
    return phoneRegex.test(phone);
}

/**
 * Validate name (not empty, reasonable length)
 */
function isValidName(name) {
    return name && name.trim().length > 2 && name.trim().length <= 100;
}

/**
 * Validate message (not empty, reasonable length)
 */
function isValidMessage(message) {
    return message && message.trim().length > 5 && message.trim().length <= 5000;
}

/**
 * Sanitize string input
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .substring(0, 1000); // Limit length
}

/**
 * Sanitize email
 */
function sanitizeEmail(email) {
    return sanitizeString(email).toLowerCase();
}

/**
 * Validate test drive request
 */
function validateTestDriveRequest(data) {
    const errors = [];
    
    if (!isValidName(data.name)) {
        errors.push('Invalid name');
    }
    if (!isValidEmail(data.email)) {
        errors.push('Invalid email');
    }
    if (!isValidPhone(data.phone)) {
        errors.push('Invalid phone');
    }
    if (!data.model || data.model.trim().length === 0) {
        errors.push('Model is required');
    }
    if (data.message && !isValidMessage(data.message)) {
        errors.push('Invalid message');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate contact request
 */
function validateContactRequest(data) {
    const errors = [];
    
    if (!isValidName(data.name)) {
        errors.push('Invalid name');
    }
    if (!isValidEmail(data.email)) {
        errors.push('Invalid email');
    }
    if (!isValidMessage(data.message)) {
        errors.push('Invalid message');
    }
    if (data.phone && !isValidPhone(data.phone)) {
        errors.push('Invalid phone');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate newsletter subscription
 */
function validateNewsletterEmail(email) {
    return isValidEmail(email);
}

/**
 * Sanitize test drive data
 */
function sanitizeTestDriveData(data) {
    return {
        name: sanitizeString(data.name),
        email: sanitizeEmail(data.email),
        phone: sanitizeString(data.phone),
        model: sanitizeString(data.model),
        message: data.message ? sanitizeString(data.message) : '',
        date: data.date || null
    };
}

/**
 * Sanitize contact data
 */
function sanitizeContactData(data) {
    return {
        name: sanitizeString(data.name),
        email: sanitizeEmail(data.email),
        phone: data.phone ? sanitizeString(data.phone) : '',
        model: data.model ? sanitizeString(data.model) : '',
        message: sanitizeString(data.message)
    };
}

module.exports = {
    isValidEmail,
    isValidPhone,
    isValidName,
    isValidMessage,
    sanitizeString,
    sanitizeEmail,
    validateTestDriveRequest,
    validateContactRequest,
    validateNewsletterEmail,
    sanitizeTestDriveData,
    sanitizeContactData
};