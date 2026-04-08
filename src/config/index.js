/**
 * Centralized configuration module
 * Never call process.env directly in business logic - use this module instead
 * @module config
 */

const config = {
  // Server
  port: process.env.PORT || 5050,
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.BASE_URL || 'http://localhost:5050',

  // Database
  mongodbUri: process.env.MONGODB_URI,

  // Authentication
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    isConfigured: !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    )
  },

  // Email Services
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    isConfigured: !!process.env.SENDGRID_API_KEY
  },

  gmail: {
    user: process.env.GMAIL_USER,
    appPassword: process.env.GMAIL_APP_PASSWORD
  },

  // Mailchimp
  mailchimp: {
    apiKey: process.env.MAILCHIMP_API_KEY,
    serverPrefix: process.env.MAILCHIMP_SERVER_PREFIX,
    audienceId: process.env.MAILCHIMP_AUDIENCE_ID
  },

  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:5050', 'http://localhost:3000'],

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    authMax: 10
  }
};

/**
 * Validates that all required environment variables are present
 * @returns {string[]} Array of missing variable names
 */
const validateEnv = () => {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'MAILCHIMP_API_KEY',
    'MAILCHIMP_SERVER_PREFIX',
    'MAILCHIMP_AUDIENCE_ID',
    'SENDGRID_API_KEY',
    'GMAIL_USER',
    'GMAIL_APP_PASSWORD',
    'BASE_URL'
  ];

  return required.filter(varName => !process.env[varName]);
};

module.exports = { config, validateEnv };
