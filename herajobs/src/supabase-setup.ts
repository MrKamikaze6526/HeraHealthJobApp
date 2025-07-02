// Supabase Setup Utility
// This script helps set up the required Supabase storage bucket for resumes

import { createClient } from '@supabase/supabase-js';

// Same credentials as in main.ts
const supabaseUrl = 'https://fgiddweoaadwbbagywer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnaWRkd2VvYWFkd2JiYWd5d2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4OTA4MDAsImV4cCI6MjA2NjQ2NjgwMH0.T6dOkxWChS5VVhtris1rGbL7m8VReGf2-x9Ou7Hstdg';

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to set up the resumes bucket
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
