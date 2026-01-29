const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('./config/db');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const analyticsMiddleware = require('./middleware/analyticsMiddleware');
const validateEnv = require('./utils/validateEnv');

// Load env vars
dotenv.config();

// Validate environment variables
validateEnv();

// Initialize Models and Associations
require('./models/associations');

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

const app = express();

// Enable Gzip Compression for much faster loading
app.use(compression());

// Trust Proxy (Required for express-rate-limit on cPanel/Nginx)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            "worker-src": ["'self'", "blob:", "cdnjs.cloudflare.com"],
            "img-src": ["'self'", "data:", "https://api.qrserver.com", "https://*.qrserver.com", "https://cdn-icons-png.flaticon.com", "https://*.cloudinary.com", "https://*.googleusercontent.com"],
            "media-src": ["'self'", "https://www.soundhelix.com", "https://assets.mixkit.co", "https://www.soundjay.com", "blob:"],
            "connect-src": ["'self'", "https://*.cloudinary.com", "https://*.googleapis.com"]
        },
    },
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter to all routes
app.use(limiter);

// Specific stricter limiter for Auth routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login/register attempts per hour
    message: { message: 'Too many authentication attempts, please try again after an hour' }
});
app.use('/api/auth', authLimiter);

// CSRF Protection (Critical Security Fix)
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// CSRF token endpoint (must be unprotected)
app.get('/api/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Apply CSRF protection to state-changing routes
app.use('/api/auth/register', csrfProtection);
app.use('/api/auth/login', csrfProtection);
app.use('/api/users', csrfProtection);
app.use('/api/stories', csrfProtection);
app.use('/api/reviews', csrfProtection);
app.use('/api/favorites', csrfProtection);

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGIN || 'https://kids.genarabi.com'
        : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

// Increase timeout for large file uploads (10 minutes)
app.use((req, res, next) => {
    req.setTimeout(600000); // 10 minutes
    res.setTimeout(600000); // 10 minutes
    next();
});

// Force HTTPS in Production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            return res.redirect(`https://${req.header('host')}${req.url}`);
        }
        next();
    });
}

// Analytics Middleware (before routes)
app.use(analyticsMiddleware);

// 1. Static: Serve uploads (with CORS headers)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, path, stat) => {
        res.set('Access-Control-Allow-Origin', '*');
    }
}));

// Explicit 404 for missing uploads to prevent SPA fallback
app.use('/uploads', (req, res) => {
    res.status(404).send('File not found');
});

// 2. Base Route (Test)
// app.get('/', (req, res) => {
//     res.send('API is running...');
// });

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/stories', require('./routes/storyRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/subscribers', require('./routes/subscriberRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/tips', require('./routes/tipsRoutes'));

// --- Diagnostic Route ---
app.get('/api/debug/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) { // routes registered directly on the app
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') { // router middleware
            const base = middleware.regexp.toString()
                .replace('\\/?(?=\\/|$)', '')
                .replace(/^\\?\/\^/, '')
                .replace(/\\\//g, '/')
                .replace(/\?\:\/\(\?\:.*$/, '');

            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    routes.push({
                        path: base + handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    res.json(routes);
});

// --- Frontend Routing (Must be last) ---

// 3. Static: Serve Frontend (CSS/JS files)
// This logic handles various server environments (local, cPanel, dist)
let distPath = path.join(__dirname, 'dist');

if (!fs.existsSync(distPath)) {
    distPath = path.join(__dirname, '../dist');
}

// Fallback for cPanel standard folder name
if (!fs.existsSync(distPath)) {
    distPath = path.join(__dirname, 'public_html');
}

// Fallback for users who rename 'dist' to 'public'
if (!fs.existsSync(distPath)) {
    distPath = path.join(__dirname, 'public');
}

console.log('--- Path Resolution ---');
console.log('Current __dirname:', __dirname);
console.log('Resolved distPath:', distPath);
console.log('index.html exists?:', fs.existsSync(path.join(distPath, 'index.html')));
console.log('-----------------------');

app.use(express.static(distPath));

// 4. API 404 Handler (Safe Regex)
app.all(/\/api\/.*/, (req, res) => {
    res.status(404).json({ message: 'API route not found' });
});

// 5. Catch-All Handler (SPA Routing)
// IMPORTANT: We only send index.html if the request is NOT for a file (like .js, .css, .png)
// This prevents the "MIME type text/html" error when a script fails to load.
app.use((req, res) => {
    // If request has an extension (like .js or .css) and we reached here, it's a true 404
    if (path.extname(req.url)) {
        return res.status(404).json({ message: 'Resource not found' });
    }

    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend application not found. Please ensure the "public" or "dist" folder is correctly uploaded.');
    }
});

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Increase timeouts for large file uploads (e.g. 100+ pages of PDF)
// Default is usually 120,000ms (2 mins). We set it to 10 minutes.
server.timeout = 600000;
server.headersTimeout = 601000;
server.keepAliveTimeout = 60000;