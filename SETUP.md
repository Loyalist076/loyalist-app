# Loyalist App Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- Gmail account for SMTP
- Cloudinary account
- SendGrid account
- Mailchimp account

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and fill in all the required values:

#### MongoDB Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (free tier available)
3. Get your connection string
4. Replace `MONGODB_URI` in `.env`

#### JWT Secret
Generate a secure random string:
```bash
openssl rand -base64 32
```
Set this as `JWT_SECRET` in `.env`

#### Gmail SMTP
1. Enable 2FA on your Gmail account
2. Generate an App Password: [Google Account Settings](https://myaccount.google.com/apppasswords)
3. Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `.env`

#### Cloudinary
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret from dashboard
3. Set in `.env`

#### SendGrid
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key with Mail Send permissions
3. Verify a sender email
4. Create a dynamic template for newsletter
5. Set `SENDGRID_API_KEY` in `.env`

#### Mailchimp
1. Sign up at [Mailchimp](https://mailchimp.com/)
2. Create an API key
3. Create an audience and get the Audience ID
4. Set `MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX`, and `MAILCHIMP_AUDIENCE_ID` in `.env`

### 3. Create Required Directories
```bash
mkdir -p uploads
mkdir -p public/uploads/financials
touch public/uploads/financials/.gitkeep
```

### 4. Start the Server

Development mode:
```bash
npm start
```

Or with nodemon:
```bash
npx nodemon server.js
```

The server will start on `http://localhost:5050` (or the PORT you specified in `.env`)

## Verifying the Setup

### 1. Check Environment Variables
The server will exit with an error message if any required environment variables are missing.

### 2. Test Database Connection
If MongoDB connection fails, check:
- Your MongoDB URI is correct
- Your IP address is whitelisted in MongoDB Atlas
- Network/firewall settings

### 3. Test Authentication
```bash
# Register a user
curl -X POST http://localhost:5050/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@example.com","password":"admin123","role":"admin"}'

# Login
curl -X POST http://localhost:5050/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

You should receive a JWT token in the response.

## Common Issues

### "Missing required environment variables"
Make sure all variables in `.env.example` are set in your `.env` file.

### "MongoDB connection error"
- Check your connection string
- Whitelist your IP in MongoDB Atlas
- Ensure your database user has correct permissions

### "SMTP configuration error"
- Verify Gmail credentials
- Ensure App Password (not regular password) is used
- Check if 2FA is enabled on Gmail

### Rate limiting errors
If testing rapidly, you may hit rate limits:
- Wait 15 minutes
- Or temporarily increase limits in `server.js`

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Strong JWT secret generated
- [ ] All API keys are valid and active
- [ ] Gmail App Password created (not regular password)
- [ ] MongoDB user has minimal required permissions
- [ ] CORS origins configured for production
- [ ] HTTPS enabled in production

## Next Steps

1. **Update Frontend**: Modify admin pages to send JWT tokens with requests
2. **Test All Features**: Verify authentication works for all admin operations
3. **Deploy**: Use services like Heroku, Railway, or DigitalOcean
4. **Monitor**: Set up logging and monitoring in production
5. **Backup**: Configure automated MongoDB backups

## Support

For issues or questions, please refer to:
- [SECURITY_FIXES.md](SECURITY_FIXES.md) - Security improvements documentation
- [package.json](package.json) - Dependencies and scripts
