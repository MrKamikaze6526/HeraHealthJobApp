# Hera Health Solutions Job Application Tracker

A modern job application tracking system built with Vite, TypeScript, and Supabase.

## 🔒 Security Setup

⚠️ **IMPORTANT**: Never commit sensitive credentials to your repository!

### Environment Variables

This project uses environment variables to keep sensitive information secure. 

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Update `.env` with your actual values:**
   ```bash
   VITE_SUPABASE_URL=your-actual-supabase-url
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   VITE_ADMIN_PASSWORD=your-secure-admin-password
   ```

3. **Never commit `.env` to git** - it's already in `.gitignore`

### Security Features

- ✅ Environment variable configuration
- ✅ Content Security Policy headers
- ✅ XSS protection
- ✅ CSRF protection through Supabase
- ✅ Admin password protection
- ✅ Secure file upload validation

### For Deployment

When deploying to Render, Vercel, or other platforms:

1. Set environment variables in your hosting platform's dashboard
2. Use the same variable names as in `.env.example`
3. Use strong, unique passwords for production
4. Consider implementing rate limiting in Supabase

## 🚀 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📦 Deployment

The application is configured for easy deployment to:
- Render
- Vercel
- Netlify
- Any static hosting platform

Make sure to set the environment variables in your hosting platform's settings.

## 🔧 Features

- Public job listings (no login required)
- Secure application process (login required)
- Admin dashboard for managing jobs and applications
- Resume upload functionality
- Email notifications
- Responsive design
