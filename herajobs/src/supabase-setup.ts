// Supabase Setup Utility
// This script helps set up the required Supabase storage bucket for resumes

/**
 * supabase-setup.ts
 *
 * Utility script to set up the required Supabase storage bucket for resumes.
 * Used for initial project setup and admin operations.
 *
 * Exports:
 * - setupResumesBucket: Create and test the resumes bucket in Supabase Storage
 *
 * Author: Hera Health Solutions
 * Last updated: 2025-07-22
 */

import { createClient } from '@supabase/supabase-js';

// Use environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to set up the resumes bucket
/**
 * Set up the resumes bucket in Supabase Storage.
 * Checks for existence, creates if needed, and tests access.
 * @returns true if setup successful, false otherwise
 */
export async function setupResumesBucket() {
  try {
    console.log('🔧 Setting up Supabase storage bucket...');
    
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return false;
    }
    
    const existingBucket = buckets?.find(bucket => bucket.name === 'resumes');
    
    if (existingBucket) {
      console.log('✅ Resumes bucket already exists!');
      return true;
    }
    
    // Create the bucket
    const { error: createError } = await supabase.storage.createBucket('resumes', {
      public: true,
      allowedMimeTypes: [
        'application/pdf',
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (createError) {
      console.error('❌ Error creating bucket:', createError);
      return false;
    }
    
    console.log('✅ Resumes bucket created successfully!');
    
    // Test bucket access
    const { error: testError } = await supabase.storage.from('resumes').list();
    
    if (testError) {
      console.error('⚠️  Warning: Bucket created but test access failed:', testError);
      return false;
    }
    
    console.log('✅ Bucket access test successful!');
    return true;
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return false;
  }
}

// Function to test bucket functionality
export async function testBucketFunctionality() {
  try {
    console.log('🧪 Testing bucket functionality...');
    
    // Create a small test file
    const testContent = new Blob(['Test file for bucket functionality'], { type: 'text/plain' });
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    
    const testPath = `test_${Date.now()}.txt`;
    
    // Upload test file
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(testPath, testFile);
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
      return false;
    }
    
    console.log('✅ Upload test successful');
    
    // Download test file
    const { error: downloadError } = await supabase.storage
      .from('resumes')
      .download(testPath);
    
    if (downloadError) {
      console.error('❌ Download test failed:', downloadError);
      return false;
    }
    
    console.log('✅ Download test successful');
    
    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('resumes')
      .remove([testPath]);
    
    if (deleteError) {
      console.warn('⚠️  Warning: Could not clean up test file:', deleteError);
    } else {
      console.log('✅ Cleanup successful');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run setup if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - expose functions globally
  (window as any).setupResumesBucket = setupResumesBucket;
  (window as any).testBucketFunctionality = testBucketFunctionality;
  
  console.log('🔧 Supabase setup utilities loaded!');
  console.log('📝 Available functions:');
  console.log('  - setupResumesBucket() - Creates the resumes storage bucket');
  console.log('  - testBucketFunctionality() - Tests upload/download functionality');
}
