// Environment Variables Validator
const requiredEnvVars = [
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'DB_HOST',
    'JWT_SECRET',
    'NODE_ENV'
];

const optionalEnvVars = [
    'PORT',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'GEMINI_API_KEY'
];

/**
 * Validate environment variables
 */
const validateEnv = () => {
    const missing = [];
    const warnings = [];

    // Check required variables
    requiredEnvVars.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });

    // Check JWT_SECRET strength
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        warnings.push('JWT_SECRET should be at least 32 characters for better security');
    }

    // Check DB_PASSWORD strength
    if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.length < 8) {
        warnings.push('DB_PASSWORD should be at least 8 characters');
    }

    // Check NODE_ENV
    if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
        warnings.push('NODE_ENV should be one of: development, production, test');
    }

    // Report missing variables
    if (missing.length > 0) {
        console.error('\n❌ Missing required environment variables:');
        missing.forEach(varName => console.error(`   - ${varName}`));
        console.error('\nPlease create a .env file with these variables.\n');
        process.exit(1);
    }

    // Report warnings
    if (warnings.length > 0) {
        console.warn('\n⚠️  Environment variable warnings:');
        warnings.forEach(warning => console.warn(`   - ${warning}`));
        console.warn('');
    }

    // Check optional but recommended
    const missingOptional = optionalEnvVars.filter(varName => !process.env[varName]);
    if (missingOptional.length > 0 && process.env.NODE_ENV !== 'production') {
        console.info('\nℹ️  Optional environment variables not set:');
        missingOptional.forEach(varName => console.info(`   - ${varName}`));
        console.info('');
    }

    console.log('✅ Environment variables validated successfully\n');
};

module.exports = validateEnv;
