/**
 * Security Best Practices Documentation
 * 
 * This file contains important security configuration and guidelines.
 */

// ============================================
// 1. ENVIRONMENT VARIABLES (.env)
// ============================================

/*
REQUIRED VARIABLES:
------------------
DB_NAME=jeen_arabi
DB_USER=root
DB_PASSWORD=<STRONG_PASSWORD>  # At least 12 characters, mixed case, numbers, symbols
DB_HOST=localhost
JWT_SECRET=<RANDOM_64_CHARS>   # Use: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
NODE_ENV=production

OPTIONAL BUT RECOMMENDED:
------------------------
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_key

SECURITY NOTES:
--------------
✅ NEVER commit .env to Git
✅ Use strong, random JWT_SECRET (64+ characters)
✅ Use complex DB_PASSWORD
✅ Change all secrets in production
✅ Use different secrets per environment
*/

// ============================================
// 2. PASSWORD REQUIREMENTS
// ============================================

/*
Minimum Requirements:
- At least 8 characters
- One lowercase letter (a-z)
- One uppercase letter (A-Z)
- One number (0-9)
- One special character (@$!%*?&#)

Examples of STRONG passwords:
- MyP@ssw0rd2024!
- Secure#Pass123
- J33n@r@b1!

Examples of WEAK passwords (DON'T USE):
- password123
- 12345678
- admin
*/

// ============================================
// 3. HTTPS/SSL CONFIGURATION
// ============================================

/*
For PRODUCTION deployment:

1. Obtain SSL Certificate:
   - Use Let's Encrypt (free): https://letsencrypt.org/
   - OR use your hosting provider's SSL

2. Enable HTTPS in your hosting:
   - cPanel: SSL/TLS Status
   - Namecheap: Positive SSL
   - Vercel/Netlify: Auto HTTPS

3. Force HTTPS redirect:
   Add to server.js (before routes):
   
   if (process.env.NODE_ENV === 'production') {
       app.use((req, res, next) => {
           if (req.header('x-forwarded-proto') !== 'https') {
               res.redirect(`https://${req.header('host')}${req.url}`);
           } else {
               next();
           }
       });
   }
*/

// ============================================
// 4. RATE LIMITING CONFIGURATION
// ============================================

/*
Current Settings:
- General: 100 requests / 15 minutes
- Auth: 10 requests / 1 hour

Adjust based on your needs in server.js
*/

// ============================================
// 5. CORS CONFIGURATION
// ============================================

/*
Current: Allows all origins (*)

For PRODUCTION, restrict to your domain:

app.use(cors({
    origin: 'https://yourdomain.com',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
*/

// ============================================
// 6. DATABASE BACKUP
// ============================================

/*
IMPORTANT: Backup your MySQL database regularly!

Manual Backup:
mysqldump -u root -p jeen_arabi > backup_$(date +%Y%m%d).sql

Automated Backup (cron):
0 2 * * * mysqldump -u root -p<PASSWORD> jeen_arabi > /backups/jeen_$(date +\%Y\%m\%d).sql

Restore:
mysql -u root -p jeen_arabi < backup_20260110.sql
*/

// ============================================
// 7. SECURITY HEADERS (Already Configured)
// ============================================

/*
✅ helmet.js enabled
✅ CSP (Content Security Policy)
✅ X-Frame-Options: DENY
✅ X-Content-Type-Options: nosniff
✅ Strict-Transport-Security
✅ X-XSS-Protection
*/

// ============================================
// 8. MONITORING & LOGGING
// ============================================

/*
Recommended Tools:
- PM2 for process management
- Morgan for HTTP logging
- Winston for application logging
- Sentry for error tracking

Install PM2:
npm install -g pm2
pm2 start server.js --name jeen-arabi
pm2 save
pm2 startup
*/

// ============================================
// 9. SECURITY CHECKLIST
// ============================================

/*
Before Going to Production:

Authentication & Authorization:
☑ Strong JWT_SECRET set
☑ Password hashing (bcrypt)
☑ Protected routes with middleware
☑ Admin-only endpoints secured

Database:
☑ Strong DB password
☑ SQL injection prevention (Sequelize)
☑ Database backups configured
☑ Foreign keys enforced

Network Security:
☐ HTTPS enabled
☑ CORS properly configured
☑ Rate limiting active
☑ Helmet.js headers

Code Security:
☑ Input validation
☑ XSS prevention
☑ CSRF protection (if needed)
☑ Dependencies updated

Privacy:
☑ IP hashing (Analytics)
☑ GDPR compliance
☑ Privacy policy published
☑ Cookie consent

Monitoring:
☐ Error logging configured
☐ Performance monitoring
☐ Security alerts setup
☐ Regular backups automated
*/

module.exports = {
    // Export configuration constants
    SECURITY_HEADERS_ENABLED: true,
    PASSWORD_MIN_LENGTH: 8,
    JWT_EXPIRY: '7d',
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX: 100
};
