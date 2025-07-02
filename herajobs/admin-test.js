// Test script to verify the admin functionality
// This can be run in the browser console to test features

console.log('Admin Backend Test Script Loaded');

// Test function to check if admin features are accessible
function testAdminFeatures() {
  console.log('Testing admin features...');
  
  // Check if admin elements exist
  const adminJobListings = document.getElementById('admin-job-listings');
  const totalJobs = document.getElementById('total-jobs');
  const totalApplications = document.getElementById('total-applications');
  
  console.log('Admin job listings element:', adminJobListings ? 'Found' : 'Not found');
  console.log('Total jobs counter:', totalJobs ? 'Found' : 'Not found');
  console.log('Total applications counter:', totalApplications ? 'Found' : 'Not found');
  
  // Check if View Applications buttons exist
  const viewApplicantsButtons = document.querySelectorAll('.view-applicants-btn');
  console.log('View Applicants buttons found:', viewApplicantsButtons.length);
  
  return {
    adminJobListings: !!adminJobListings,
    totalJobs: !!totalJobs,
    totalApplications: !!totalApplications,
    viewApplicantsButtons: viewApplicantsButtons.length
  };
}

// Expose test function to global scope
window.testAdminFeatures = testAdminFeatures;

// Test admin authentication
function testAdminAuth() {
  const isAuthenticated = sessionStorage.getItem('adminAuthed') === 'true';
  console.log('Admin authenticated:', isAuthenticated);
  return isAuthenticated;
}

window.testAdminAuth = testAdminAuth;

// Test RLS and database connectivity
async function testDatabaseAccess() {
  console.log('🔍 Testing database access and RLS policies...');
  
  try {
    // Test 1: Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User authentication:', user ? '✅ Authenticated' : '❌ Not authenticated');
    if (userError) console.error('User error:', userError);
    
    // Test 2: Try to read jobs (should work)
    const { data: jobs, error: jobsError } = await supabase.from('jobs').select('id, title').limit(1);
    console.log('Jobs read test:', jobs ? '✅ Success' : '❌ Failed');
    if (jobsError) console.error('Jobs error:', jobsError);
    
    // Test 3: Try to read applications (might fail if no policies)
    const { data: apps, error: appsError } = await supabase.from('applications').select('id').limit(1);
    console.log('Applications read test:', apps ? '✅ Success' : '❌ Failed');
    if (appsError) console.error('Applications error:', appsError);
    
    // Test 4: Check RLS policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, cmd')
      .in('tablename', ['applications', 'jobs']);
    
    console.log('RLS policies:', policies ? '✅ Found policies' : '❌ No policies found');
    if (policies) {
      console.table(policies);
    }
    if (policiesError) console.error('Policies error:', policiesError);
    
    // Test 5: Try a test insert (this will show the actual RLS error)
    if (user) {
      console.log('🧪 Testing application insert...');
      const testApp = {
        job_id: 'test',
        user_id: user.id,
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-0123',
        status: 'submitted',
        submitted_at: new Date().toISOString()
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('applications')
        .insert([testApp])
        .select();
      
      if (insertError) {
        console.error('❌ Insert test failed:', insertError);
        if (insertError.message.includes('row-level security')) {
          console.log('🔧 This confirms RLS policy issue. Run the RLS setup SQL!');
        }
      } else {
        console.log('✅ Insert test successful, cleaning up...');
        // Clean up test data
        if (insertData && insertData[0]) {
          await supabase.from('applications').delete().eq('id', insertData[0].id);
        }
      }
    }
    
    return {
      userAuthenticated: !!user,
      jobsAccessible: !jobsError,
      applicationsAccessible: !appsError,
      policiesFound: !!policies?.length
    };
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return { error: error.message };
  }
}

// Test storage bucket access
async function testStorageAccess() {
  console.log('📁 Testing storage access...');
  
  try {
    // Test 1: List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log('Storage buckets:', buckets ? '✅ Accessible' : '❌ Not accessible');
    if (bucketsError) console.error('Buckets error:', bucketsError);
    
    // Test 2: Check resumes bucket specifically
    const resumesBucket = buckets?.find(bucket => bucket.name === 'resumes');
    console.log('Resumes bucket:', resumesBucket ? '✅ Exists' : '❌ Not found');
    
    if (resumesBucket) {
      // Test 3: Try to list files in resumes bucket
      const { data: files, error: filesError } = await supabase.storage.from('resumes').list();
      console.log('Resumes bucket access:', files !== null ? '✅ Accessible' : '❌ Access denied');
      if (filesError) console.error('Files error:', filesError);
    }
    
    return {
      bucketsAccessible: !bucketsError,
      resumesBucketExists: !!resumesBucket,
      resumesBucketAccessible: resumesBucket && !bucketsError
    };
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    return { error: error.message };
  }
}

// Comprehensive system test
async function runFullSystemTest() {
  console.log('🚀 Running full system diagnostic...');
  console.log('=====================================');
  
  const dbResults = await testDatabaseAccess();
  console.log('\n📊 Database Results:', dbResults);
  
  const storageResults = await testStorageAccess();
  console.log('\n📁 Storage Results:', storageResults);
  
  const adminResults = testAdminFeatures();
  console.log('\n👥 Admin UI Results:', adminResults);
  
  const authResults = testAdminAuth();
  console.log('\n🔐 Auth Results:', { adminAuthenticated: authResults });
  
  console.log('\n=====================================');
  console.log('🎯 SUMMARY:');
  
  if (dbResults.error) {
    console.log('❌ Database: Connection failed');
  } else if (!dbResults.userAuthenticated) {
    console.log('⚠️  Database: User not authenticated - login required');
  } else if (!dbResults.applicationsAccessible) {
    console.log('❌ Database: RLS policies missing - run RLS_SETUP.sql');
  } else {
    console.log('✅ Database: All checks passed');
  }
  
  if (storageResults.error) {
    console.log('❌ Storage: Connection failed');
  } else if (!storageResults.resumesBucketExists) {
    console.log('❌ Storage: Resumes bucket missing - run setupResumesBucket()');
  } else {
    console.log('✅ Storage: All checks passed');
  }
  
  return {
    database: dbResults,
    storage: storageResults,
    admin: adminResults,
    auth: { adminAuthenticated: authResults }
  };
}

// Expose new test functions
window.testDatabaseAccess = testDatabaseAccess;
window.testStorageAccess = testStorageAccess;
window.runFullSystemTest = runFullSystemTest;

console.log('Test functions available: testAdminFeatures(), testAdminAuth(), testDatabaseAccess(), testStorageAccess(), runFullSystemTest()');
