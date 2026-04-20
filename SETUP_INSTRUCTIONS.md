# FoodBar Reviews - Setup Instructions

## Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account (free tier is fine)
- Code editor (VS Code recommended)

## Step 1: Supabase Setup

1. **Create a Supabase Project**
   - Go to https://supabase.com
   - Click "New Project"
   - Name it "foodbar-reviews"
   - Set a strong database password
   - Choose a region close to you

2. **Run Database Schema**
   - In Supabase Dashboard, go to SQL Editor
   - Copy and paste the entire `supabase-schema.sql` file
   - Click "Run" to execute
   - Verify tables were created in Table Editor

3. **Configure Storage Buckets**
   - Go to Storage in Supabase Dashboard
   - Create three public buckets:
     - `post-images` (5MB file size limit)
     - `venue-images` (5MB file size limit)
     - `menu-images` (10MB file size limit)
   - For each bucket, set policies:
     - Allow INSERT for authenticated users
     - Allow SELECT for everyone (public)
     - Allow UPDATE for authenticated users (owner only)
     - Allow DELETE for authenticated users (owner only)

4. **Get API Credentials**
   - Go to Settings > API
   - Copy your `Project URL` (looks like https://xxxxx.supabase.co)
   - Copy your `anon public` key

## Step 2: Project Setup

1. **Clone and Install**
```bash
   # Navigate to your projects directory
   cd ~/projects

   # Install Angular CLI globally
   npm install -g @angular/cli@20

   # Create the Angular project
   ng new food-bar-review-app --routing --style=scss

   # Navigate into project
   cd food-bar-review-app

   # Install dependencies
   npm install @supabase/supabase-js
   npm install @angular/forms
   npm install ngx-infinite-scroll
   npm install tesseract.js

   # Install dev dependencies
   npm install --save-dev @types/node
```

2. **Configure Environment**
   - Create `src/environments/environment.ts`:
```typescript
   export const environment = {
     production: false,
     supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
     supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
   };
```

   - Create `src/environments/environment.prod.ts`:
```typescript
   export const environment = {
     production: true,
     supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
     supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
   };
```

   - Replace the placeholder values with your actual Supabase credentials

3. **Add TypeScript Configuration**
   - Update `tsconfig.json` to include:
```json
   {
     "compilerOptions": {
       "paths": {
         "@app/*": ["src/app/*"],
         "@env/*": ["src/environments/*"]
       }
     }
   }
```

## Step 3: Development

1. **Start Development Server**
```bash
   ng serve
```
   - Open browser to http://localhost:4200

2. **Create First User**
   - Navigate to /register
   - Create an account
   - Check Supabase Dashboard > Authentication to verify user was created

3. **Test Features**
   - Create a venue (you'll need to update your user role to 'owner' in Supabase)
   - Upload a menu
   - Create a post with rating
   - Browse by food item, bar, and genre

## Step 4: Version Control

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Angular + Supabase food review app"

# Create GitHub repository (on GitHub.com)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/food-bar-review-app.git
git branch -M main
git push -u origin main
```

## Step 5: Build for Production

```bash
# Build the app
ng build --configuration production

# Output will be in dist/ folder
# Deploy to:
# - Vercel: vercel deploy
# - Netlify: netlify deploy
# - Firebase: firebase deploy
```

## Mobile App Deployment (Future)

To convert this to a mobile app:

1. **Use Capacitor**
```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init
   npx cap add android
   npx cap add ios
```

2. **Build and Sync**
```bash
   ng build --configuration production
   npx cap sync
   npx cap open android
   npx cap open ios
```

## Troubleshooting

### Database Connection Issues
- Verify Supabase credentials in environment files
- Check Supabase project status in dashboard
- Ensure RLS policies are enabled

### Storage Upload Fails
- Verify storage buckets are created
- Check bucket policies allow authenticated uploads
- Ensure file size is within limits

### Rating Not Updating
- Check database triggers are active
- Verify posts table has venue_id or menu_item_id

## Support

For issues:
1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Review Angular error messages
4. Check network tab for failed requests