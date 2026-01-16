/* ============================================
   MIDDLEWARE
   Custom middleware for logging, errors, etc.
   ============================================ */

/**
 * Custom logging middleware
 */
function requestLogger(req, res, next) {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const status = res.statusCode;
        const statusColor = status >= 400 ? '\x1b[31m' : '\x1b[32m'; // Red for errors, green for success
        const reset = '\x1b[0m';
        
        console.log(
            `[${new Date().toISOString()}] ${req.method} ${req.path} ${statusColor}${status}${reset} (${duration}ms)`
        );
    });
    
    next();
}

/**
 * Error handling middleware
 */
function errorHandler(err, req, res, next) {
    console.error('[ERROR]', err);
    
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { error: err.stack })
    });
}

/**
 * 404 handler
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path
    });
}

/**
 * CORS configuration
 */
const corsOptions = {
    origin: function (origin, callback) {
        // Allowed origins
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8000',
            'http://localhost:5000',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:8000'
        ];
        
        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
            callback(null, true);
            return;
        }
        
        // In production, check origin
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

/**
 * Request size limiter middleware
 */
function requestSizeLimiter(req, res, next) {
    const maxSize = 1024 * 1024; // 1MB
    
    if (req.get('content-length') > maxSize) {
        return res.status(413).json({
            success: false,
            message: 'Payload too large'
        });
    }
    
    next();
}

/**
 * Validation error formatter
 */
function validationErrorFormatter(errors) {
    if (Array.isArray(errors)) {
        return errors.map(err => ({
            field: err.param,
            message: err.msg
        }));
    }
    return errors;
}

module.exports = {
    requestLogger,
    errorHandler,
    notFoundHandler,
    corsOptions,
    requestSizeLimiter,
    validationErrorFormatter
};
