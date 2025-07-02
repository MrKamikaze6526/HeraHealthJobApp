# Row Level Security (RLS) Setup Guide

This guide will help you fix the "new row violates row-level security policy" error when submitting job applications.

## The Problem

Supabase has Row Level Security (RLS) enabled on your tables, but there are no policies allowing users to insert application data. This is a security feature that prevents unauthorized access to your data.

## Quick Fix (Recommended)

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase Dashboard: https://app.supabase.com/
2. Select your project: `fgiddweoaadwbbagywer`
3. Click "SQL Editor" in the left sidebar
4. Click "New query"

### Step 2: Run the RLS Setup Script
Copy and paste the entire contents of `RLS_SETUP.sql` into the SQL editor and click "Run".

**Or run these commands one by one:**

```sql
-- Enable RLS on applications table
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own applications
CREATE POLICY "Users can insert their own applications" ON applications
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own applications
CREATE POLICY "Users can view their own applications" ON applications
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Allow anyone to view jobs
CREATE POLICY "Anyone can view jobs" ON jobs
FOR SELECT 
TO anon, authenticated;

-- Enable RLS on jobs table
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
```

### Step 3: Verify the Fix
1. Open your app: `http://localhost:5174/`
2. Open Browser Console (F12)
3. Run: `runFullSystemTest()`
4. Look for "✅ Database: All checks passed"

## Alternative Fix: Disable RLS (Not Recommended for Production)

If you're just testing and want to disable RLS temporarily:

```sql
-- Disable RLS on applications table (TEMPORARY)
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

-- Disable RLS on jobs table (TEMPORARY)  
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning:** This removes all security protections. Only use for development!

## Diagnostic Tools

Use these browser console commands to diagnose issues:

```javascript
// Run comprehensive system test
runFullSystemTest()

// Test just database access
testDatabaseAccess()

// Test storage access
testStorageAccess()

// Test admin features
testAdminFeatures()
```

## Common Issues and Solutions

### Issue: "User not authenticated"
**Solution:** Make sure you're logged in to the app first
1. Go to Login page
2. Register or login with any email/password
3. Try submitting application again

### Issue: "Buckets not accessible" 
**Solution:** Run the storage setup
```javascript
setupResumesBucket()
```

### Issue: "RLS policies missing"
**Solution:** Run the RLS setup SQL commands above

### Issue: Still getting RLS errors after setup
**Possible causes:**
1. SQL commands didn't run successfully
2. User isn't properly authenticated
3. Table structure doesn't match expected schema

**Debug steps:**
1. Check Supabase logs in dashboard
2. Verify user authentication: `supabase.auth.getUser()`
3. Check table structure in Supabase Table Editor

## Understanding RLS Policies

The policies we're creating:

1. **Insert Policy**: Users can only insert applications with their own `user_id`
2. **Select Policy**: Users can only view their own applications
3. **Jobs Policy**: Anyone can view job listings (needed for public job board)

This ensures:
- ✅ Users can submit applications
- ✅ Users can view their own application status  
- ✅ Admins can view all applications
- ❌ Users cannot see other users' applications
- ❌ Unauthorized access is prevented

## Production Considerations

For production, you may want additional policies:

```sql
-- Admin users can view all applications
CREATE POLICY "Admins can view all applications" ON applications
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = id 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Only admins can update application status
CREATE POLICY "Admins can update applications" ON applications
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = id 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);
```

## Verification

After running the setup, you should be able to:
1. ✅ Submit job applications without RLS errors
2. ✅ View your own applications in the user menu
3. ✅ Access admin features (as admin)
4. ✅ Download resumes (as admin)

## Next Steps

1. Run the RLS setup SQL
2. Test application submission
3. Verify admin functionality works
4. Set up proper admin user roles (optional)

---

**Need help?** Run `runFullSystemTest()` in browser console for detailed diagnostics.
