-- Supabase RLS Policy Setup for Applications Table
-- Run these SQL commands in your Supabase SQL Editor

-- First, let's check the current state of RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('applications', 'jobs');

-- Check existing policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('applications', 'jobs');

-- ================================
-- APPLICATIONS TABLE POLICIES
-- ================================

-- Policy 1: Allow authenticated users to insert their own applications
CREATE POLICY "Users can insert their own applications" ON applications
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Allow users to view their own applications
CREATE POLICY "Users can view their own applications" ON applications
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Policy 3: Allow users to update their own applications (optional)
CREATE POLICY "Users can update their own applications" ON applications
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Allow service role (admin) to view all applications
CREATE POLICY "Service role can manage all applications" ON applications
FOR ALL 
TO service_role;

-- Policy 5: Allow anonymous users to read jobs (for job listings)
CREATE POLICY "Anyone can view jobs" ON jobs
FOR SELECT 
TO anon, authenticated;

-- Policy 6: Only service role can manage jobs
CREATE POLICY "Service role can manage jobs" ON jobs
FOR ALL 
TO service_role;

-- ================================
-- ENABLE RLS IF NOT ALREADY ENABLED
-- ================================

-- Enable RLS on applications table
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Enable RLS on jobs table  
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- ================================
-- VERIFICATION QUERIES
-- ================================

-- Check that policies were created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('applications', 'jobs')
ORDER BY tablename, policyname;

-- Test query to see if we can insert (this should work for authenticated users)
-- SELECT auth.uid() as current_user_id;
