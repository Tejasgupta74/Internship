# Deployment Guide for Render

This guide will help you deploy your Internship & Skill Tracker application to Render.

## Prerequisites

1. **Render Account** - Sign up at [render.com](https://render.com)
2. **GitHub Repository** - Push your code to GitHub (Render integrates with GitHub)
3. **MongoDB Atlas** - Database connection string (mongodb+srv://...)
4. **Gmail App Password** - For email functionality (not your regular Gmail password)

## Step 1: Prepare Your Repository

1. Make sure all your code is committed and pushed to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push
   ```

2. Ensure your `.env` file is NOT in version control (should be in `.gitignore`)

## Step 2: Set Up on Render

### Option A: Using render.yaml (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and configure the service
5. Proceed to Step 3 to add environment variables

### Option B: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `internship-tracker` (or your choice)
   - **Region**: Oregon (or closest to you)
   - **Branch**: `main` (or your default branch)
   - **Runtime**: Node
   - **Root Directory**: `full_project_with_resume_support/internship_final_fullstack_fixed_all/backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter (Free tier available)

## Step 3: Add Environment Variables

In Render dashboard, go to your service's **"Environment"** tab and add:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/internship?retryWrites=true&w=majority
JWT_SECRET=your_very_strong_random_secret_key_at_least_32_characters
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-app-name.onrender.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SIGNUP_FROM=your_email@gmail.com
LOGIN_FROM=your_email@gmail.com
TEST_TO=your_email@gmail.com
NODE_ENV=production
PORT=5000
```

### Getting a Gmail App Password

1. Go to [Google Account](https://myaccount.google.com)
2. Go to **Security** → **App passwords**
3. Select **Mail** and **Windows Computer** (any device)
4. Google will generate a 16-character password
5. Use this password as `SMTP_PASS`

## Step 4: Deploy

1. Click the **"Create"** button to start deployment
2. Render will build and deploy your app automatically
3. Check the deploy logs for any errors
4. Once deployed, your app will be available at `https://your-app-name.onrender.com`

## Step 5: Verify Deployment

- Visit your app URL in a browser
- Test login functionality
- Check that the backend API is responding
- Verify email notifications are working

## Troubleshooting

### Build Fails with "Module not found"
- Ensure all dependencies are in `package.json`
- Check that relative paths are correct (use `../` from backend to access frontend)

### Port Already in Use
- The `npm start` script uses `npx kill-port 5000` to clear the port
- If issues persist, Render manages port allocation automatically

### Frontend Not Serving
- Verify `frontend/dist` exists after build
- Check that `render.yaml` correctly specifies the root directory
- Ensure the build script runs before start

### Database Connection Issues
- Verify MongoDB Atlas connection string is correct
- Check that your IP is whitelisted in MongoDB Atlas (or use 0.0.0.0 for Render)
- Test the connection string locally first

### Email Not Sending
- Verify the Gmail app password is correct (not your regular password)
- Check that 2FA is enabled on your Gmail account
- Ensure the SMTP credentials are correct

## Updating Your App

After deployment, whenever you push changes to GitHub, Render will automatically redeploy:

1. Make changes locally
2. Commit and push to GitHub
3. Render will automatically rebuild and deploy

## Monitoring

1. Go to your service in Render dashboard
2. **"Logs"** tab - View real-time logs
3. **"Events"** tab - See deployment history
4. **"Metrics"** tab - Monitor CPU, memory, and requests

## Production Best Practices

1. **Use strong secrets** - Generate random strings for JWT_SECRET
2. **SSL/TLS** - Enabled by default on Render (https://...)
3. **Health checks** - Your app has a `/health` endpoint for monitoring
4. **Database backups** - Set up backups in MongoDB Atlas
5. **Monitoring** - Use Render's metrics to track performance

## Upgrading Plan

If you exceed Starter tier limits, upgrade to:
- **Starter Plus**: $12/month
- **Pro**: $19/month
- Higher tiers as needed

## Support

- **Render Docs**: https://render.com/docs
- **MongoDB Docs**: https://docs.mongodb.com
- **Express.js Docs**: https://expressjs.com
- **Vite Docs**: https://vitejs.dev

---

Your app is now ready for production on Render!
