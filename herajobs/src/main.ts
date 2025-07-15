// Import global styles
import './style.css'
import { createClient } from '@supabase/supabase-js';
import { renderHome } from './pages/home.ts';
import { renderWhyHera } from './pages/why-hera.ts';
import { renderJobs } from './pages/jobs.ts';
import { renderAdmin } from './pages/admin.ts';
import { renderApply } from './pages/apply.ts';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper: Register user in Supabase
async function registerUser(email: string, password: string): Promise<{ error?: string }> {
  // Register user without any options (Supabase project settings control email verification)
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  return {};
}

// Helper: Login user in Supabase
async function loginUser(email: string, password: string): Promise<{ error?: string }> {
  // Try to log in, and if error is 'Email not confirmed', treat as success for now
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error && error.message.toLowerCase().includes('confirm')) {
    // Ignore email confirmation error for now
    return {};
  }
  if (error) return { error: error.message };
  return {};
}

// Remove in-memory isLoggedIn, use Supabase session instead
// Helper: Check if user is logged in
async function checkLoggedIn(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

// Helper: Log out user
async function logoutUser() {
  await supabase.auth.signOut();
  window.location.hash = '#home';
}

// --- Applicant Functionality ---
// Helper: Get current user info
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper: Ensure resumes bucket exists
async function ensureResumesBucket(): Promise<void> {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const resumesBucket = buckets?.find(bucket => bucket.name === 'resumes');
    
    if (!resumesBucket) {
      // Create bucket if it doesn't exist
      const { error } = await supabase.storage.createBucket('resumes', {
        public: true,
        allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 10485760 // 10MB limit
      });
      
      if (error) {
        console.error('Error creating resumes bucket:', error);
        throw new Error('Failed to create file storage. Please contact support.');
      }
      
      console.log('Resumes bucket created successfully');
    }
  } catch (error: any) {
    console.error('Error ensuring bucket exists:', error);
    // Don't throw here, let the upload function handle it
  }
}

// Helper: Upload resume to Supabase Storage
async function uploadResume(file: File, userId: string, jobId: string): Promise<string> {
  try {
    // Ensure bucket exists first
    await ensureResumesBucket();
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please upload a PDF, DOC, or DOCX file only.');
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10485760) {
      throw new Error('File size must be less than 10MB.');
    }
    
    const fileExt = file.name.split('.').pop();
    const filePath = `resumes/${userId}_${jobId}_${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage.from('resumes').upload(filePath, file, { upsert: true });
    
    if (error) {
      console.error('Upload error:', error);
      if (error.message.includes('Bucket not found')) {
        throw new Error('File storage is not properly configured. Please contact support.');
      } else if (error.message.includes('not allowed')) {
        throw new Error('File type not allowed. Please upload PDF, DOC, or DOCX files only.');
      } else {
        throw new Error('Failed to upload file. Please try again.');
      }
    }
    
    return filePath;
  } catch (error: any) {
    console.error('Resume upload error:', error);
    throw error;
  }
}

// Helper: Get public URL for resume
export function getResumeUrl(path: string): string {
  const { data } = supabase.storage.from('resumes').getPublicUrl(path);
  return data.publicUrl;
}

// Helper: Submit application
export async function submitApplication({ 
  jobId, name, email, phone, dob, street, city, state, country, 
  education, experience, elevatorPitch, hearAbout, gender, ethnicity,
  qualifications, workEligible, termsAccepted, resumeFile 
}: { 
  jobId: string, name: string, email: string, phone: string, dob: string,
  street: string, city: string, state: string, country: string,
  education: string, experience: string, elevatorPitch: string, 
  hearAbout: string, gender: string, ethnicity: string,
  qualifications: boolean, workEligible: boolean, termsAccepted: boolean, resumeFile: File 
}): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('You must be logged in to submit an application.');
  
  let resumePath = '';
  if (resumeFile) {
    try {
      resumePath = await uploadResume(resumeFile, user.id, jobId);
    } catch (uploadError: any) {
      console.error('Resume upload error:', uploadError);
      throw new Error(`Resume upload failed: ${uploadError.message}`);
    }
  }
  
  try {
    // Debug: Log the data being submitted
    console.log('Submitting application with data:', {
      job_id: jobId,
      user_id: user.id,
      name,
      email,
      phone,
      dob,
      street_address: street,
      city,
      state,
      country,
      education,
      work_experience: experience,
      elevator_pitch: elevatorPitch,
      how_heard_about_us: hearAbout,
      gender,
      ethnicity,
      resume_path: resumePath,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    });
    
    console.log('Elevator pitch value specifically:', elevatorPitch);
    console.log('Elevator pitch type:', typeof elevatorPitch);
    console.log('Elevator pitch length:', elevatorPitch?.length);

    const { error } = await supabase.from('applications').insert([
      {
        job_id: jobId,
        user_id: user.id,
        prefix: name.split(' ')[0]?.includes('.') ? name.split(' ')[0] : '',
        name,
        suffix: '',
        email,
        phone,
        dob,
        street_address: street,
        city,
        state,
        country,
        education,
        work_experience: experience,
        elevator_pitch: elevatorPitch,
        how_heard_about_us: hearAbout,
        gender,
        ethnicity,
        certifications: qualifications ? 'Meets qualifications' : '',
        work_eligible: workEligible,
        terms_accepted: termsAccepted,
        resume_path: resumePath,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      }
    ]);
    
    if (error) {
      console.error('Application submission error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Handle specific error cases
      if (error.message.includes('row-level security')) {
        throw new Error('Database security policy error. Please contact support or check the RLS setup guide.');
      } else if (error.message.includes('duplicate key')) {
        throw new Error('You have already applied to this position.');
      } else if (error.message.includes('foreign key')) {
        throw new Error('Invalid job ID. Please refresh the page and try again.');
      } else if (error.message.includes('column') && error.message.includes('elevator_pitch')) {
        throw new Error('Database schema error: elevator_pitch column issue. Please contact support.');
      } else {
        throw new Error(`Application submission failed: ${error.message}`);
      }
    } else {
      console.log('Application submitted successfully!');
      
      // Verify the insertion by querying the just-inserted record
      const { data: insertedApp, error: queryError } = await supabase
        .from('applications')
        .select('id, elevator_pitch, name')
        .eq('user_id', user.id)
        .eq('job_id', jobId)
        .order('submitted_at', { ascending: false })
        .limit(1);
        
      if (insertedApp && insertedApp.length > 0) {
        console.log('Verification: Just inserted application:', insertedApp[0]);
        console.log('Verification: elevator_pitch value:', insertedApp[0].elevator_pitch);
      } else {
        console.warn('Could not verify insertion:', queryError);
      }
    }
  } catch (dbError: any) {
    console.error('Database error:', dbError);
    throw dbError;
  }
}

// Helper: Get applications for a user
async function getUserApplications(userId: string): Promise<any[]> {
  const { data, error } = await supabase.from('applications').select('*').eq('user_id', userId);
  if (error) throw new Error(error.message);
  return data || [];
}

// Helper: Get applications for a job (admin)
export async function getJobApplications(jobId: string): Promise<any[]> {
  console.log('Fetching applications for job ID:', jobId);
  const { data, error } = await supabase.from('applications').select('*').eq('job_id', jobId);
  
  if (error) {
    console.error('Error fetching applications:', error);
    throw new Error(error.message);
  }
  
  console.log('Raw data from Supabase:', data);
  if (data && data.length > 0) {
    console.log('Sample application fields:', Object.keys(data[0]));
    console.log('Sample elevator_pitch value:', data[0].elevator_pitch);
  }
  
  return data || [];
}

// Helper: Update application status (admin)
export async function updateApplicationStatus(appId: string, status: string): Promise<void> {
  const { error } = await supabase.from('applications').update({ status }).eq('id', appId);
  if (error) throw new Error(error.message);
}

// Helper: Show edit job form (admin)
function showEditJobForm(job: any): void {
  const form = document.getElementById('job-form') as HTMLFormElement;
  const showFormBtn = document.getElementById('show-job-form-btn') as HTMLButtonElement;
  
  if (!form || !showFormBtn) return;
  
  // Show the form
  form.style.display = 'block';
  showFormBtn.style.display = 'none';
  
  // Update form title
  const formTitle = form.querySelector('h4');
  if (formTitle) {
    formTitle.textContent = 'Edit Job Opening';
  }
  
  // Populate form fields with job data
  const titleInput = document.getElementById('job-title') as HTMLInputElement;
  const descInput = document.getElementById('job-desc') as HTMLTextAreaElement;
  const requiredInput = document.getElementById('job-required') as HTMLTextAreaElement;
  const recommendedInput = document.getElementById('job-recommended') as HTMLTextAreaElement;
  const salaryInput = document.getElementById('job-salary') as HTMLInputElement;
  const locationInput = document.getElementById('job-location') as HTMLInputElement;
  const workTypeSelect = document.getElementById('job-work-type') as HTMLSelectElement;
  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  
  if (titleInput) titleInput.value = job.title || '';
  if (descInput) descInput.value = job.description || '';
  if (requiredInput) requiredInput.value = job.required || '';
  if (recommendedInput) recommendedInput.value = job.recommended || '';
  if (salaryInput) salaryInput.value = job.salary || '';
  if (locationInput) locationInput.value = job.location || '';
  if (workTypeSelect) workTypeSelect.value = job.work_type || '';
  
  // Update submit button text
  if (submitBtn) {
    submitBtn.innerHTML = '<span>💾</span> Update Job';
    submitBtn.setAttribute('data-job-id', job.id);
    submitBtn.setAttribute('data-editing', 'true');
  }
  
  // Scroll to form
  form.scrollIntoView({ behavior: 'smooth' });
}

// --- Extend renderPage for applicant features ---
async function renderPage() {
  // Check login status from Supabase session
  const isLoggedIn = await checkLoggedIn();
  // Get the current hash route, default to #home
  const hash = window.location.hash || '#home';
  // Track which nav link is active
  let mainContent = '';
  let homeActive = '', jobsActive = '', whyActive = '', loginActive = '';

  if (hash === '#jobs') {
    jobsActive = 'active';
    mainContent = await renderJobs();
  } else if (hash === '#why-hera') {
    whyActive = 'active';
    mainContent = renderWhyHera();
  } else if (hash === '#login') {
    loginActive = 'active';
    mainContent = `
      <section class="login-section">
        <div class="container login-container">
          <h2>Log In</h2>
          <form class="login-form">
            <label for="email">Email Address</label>
            <input type="email" id="email" name="email" required autocomplete="username" placeholder="you@email.com" />
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="Password" />
            <button type="submit" class="cta-button primary">Log In</button>
            <div class="login-error" style="color:#c00;margin-top:0.5rem;"></div>
          </form>
          <div style="margin-top:1rem;">
            <span>No account? <a href="#register" id="go-register" style="color:var(--primary-blue);cursor:pointer;text-decoration:underline;">Register.</a></span>
          </div>
        </div>
      </section>
    `;
  } else if (hash === '#register') {
    loginActive = '';
    mainContent = `
      <section class="login-section">
        <div class="container login-container">
          <h2>Register</h2>
          <form class="register-form">
            <label for="reg-email">Email Address</label>
            <input type="email" id="reg-email" name="reg-email" required autocomplete="username" placeholder="you@email.com" />
            <label for="reg-password">Password</label>
            <input type="password" id="reg-password" name="reg-password" required autocomplete="new-password" placeholder="Create a password" />
            <button type="submit" class="cta-button primary">Register</button>
            <div class="login-error" style="color:#c00;margin-top:0.5rem;"></div>
          </form>
          <div style="margin-top:1rem;">
            <span>Already have an account? <a href="#login" id="go-login-link" style="color:var(--primary-blue);cursor:pointer;text-decoration:underline;">Log In.</a></span>
          </div>
        </div>
      </section>
    `;
  } else if (hash === '#admin') {
    const adminAuthed = sessionStorage.getItem('adminAuthed') === 'true';
    mainContent = renderAdmin(adminAuthed);
  } else if (window.location.hash.startsWith('#apply-')) {
    if (!isLoggedIn) {
      // Redirect to login if not authenticated
      window.location.hash = '#login';
      return;
    }
    const jobId = window.location.hash.replace('#apply-', '');
    mainContent = await renderApply(jobId);
  } else {
    homeActive = 'active';
    mainContent = renderHome();
  }

  // Render the main app layout and navigation
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div class="homepage">
      <header class="header">
        <div class="container nav-container">
          <div class="logo-section" id="home-logo-btn" style="cursor:pointer;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqhB2hDCOiucaTrzSVUbpxvae5rxuuUamN6Q&s" alt="Hera Health Solutions" class="logo-image" />
            <h1 class="logo">HERA HEALTH SOLUTIONS</h1>
          </div>
          <nav class="nav">
            <a href="#home" class="nav-link ${homeActive}">Home</a>
            <a href="#jobs" class="nav-link ${jobsActive}">Jobs</a>
            <a href="#why-hera" class="nav-link ${whyActive}">Why Hera?</a>
            ${isLoggedIn
              ? `<div class="nav-link account-menu" style="position:relative;">
                  <button id="account-btn" style="background:var(--primary-blue);color:white;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;border:none;cursor:pointer;">
                    <span style="font-size:1.3rem;">👤</span>
                  </button>
                  <div id="account-dropdown" style="display:none;position:absolute;right:0;top:48px;background:white;border:1px solid #e3e9f7;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);min-width:120px;z-index:10;">
                    <button id="logout-btn" style="width:100%;background:none;border:none;padding:0.7rem 1rem;text-align:left;color:#1a237e;font-size:1rem;cursor:pointer;">Log Out</button>
                  </div>
                </div>`
              : `<a href="#login" class="nav-link ${loginActive}">Log In</a>`}
          </nav>
        </div>
      </header>
      <main>${mainContent}</main>
    </div>
  `;

  // Make logo a home button
  const homeLogoBtn = document.getElementById('home-logo-btn');
  if (homeLogoBtn) {
    homeLogoBtn.addEventListener('click', () => {
      window.location.hash = '#home';
    });
  }

  // Account menu dropdown logic
  const accountBtn = document.getElementById('account-btn');
  const accountDropdown = document.getElementById('account-dropdown');
  if (accountBtn && accountDropdown) {
    accountBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      accountDropdown.style.display = accountDropdown.style.display === 'block' ? 'none' : 'block';
    });
    // Hide dropdown when clicking outside
    document.addEventListener('click', () => {
      accountDropdown.style.display = 'none';
    });
    accountDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Make View Open Positions button go to Jobs page
  const viewJobsBtn = document.querySelector('.cta-button.secondary');
  if (viewJobsBtn) {
    viewJobsBtn.addEventListener('click', () => {
      window.location.hash = '#jobs';
    });
  }

  // Add handler for 'Go to Log In' button in login required sections
  const goLoginBtn = document.getElementById('go-login');
  if (goLoginBtn) {
    goLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.hash = '#login';
    });
  }

  // Navigation between login and register pages
  const goRegister = document.getElementById('go-register');
  if (goRegister) {
    goRegister.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.hash = '#register';
    });
  }
  const goLoginLink = document.getElementById('go-login-link');
  if (goLoginLink) {
    goLoginLink.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.hash = '#login';
    });
  }

  // Handle login form submission
  if (hash === '#login') {
    const form = document.querySelector('.login-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;
        const { error } = await loginUser(email, password);
        if (!error) {
          window.location.hash = '#jobs';
        } else {
          const errorDiv = document.querySelector('.login-error');
          if (errorDiv) errorDiv.textContent = error;
        }
      });
    }
  }

  // Handle register form submission
  if (hash === '#register') {
    const form = document.querySelector('.register-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = (document.getElementById('reg-email') as HTMLInputElement).value;
        const password = (document.getElementById('reg-password') as HTMLInputElement).value;
        const { error } = await registerUser(email, password);
        if (!error) {
          window.location.hash = '#jobs';
        } else {
          const errorDiv = document.querySelector('.login-error');
          if (errorDiv) errorDiv.textContent = error;
        }
      });
    }
  }

  // Load job listings for jobs page (public access) and admin
  if ((hash === '#jobs') || (hash === '#admin' && sessionStorage.getItem('adminAuthed') === 'true')) {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*');
    if (error) {
      const jobListings = document.getElementById('job-listings');
      const adminJobListings = document.getElementById('admin-job-listings');
      if (jobListings) jobListings.innerHTML = `<div style="color:#c00;text-align:center;">Error loading jobs: ${error.message}</div>`;
      if (adminJobListings) adminJobListings.innerHTML = `<div style="color:#c00;text-align:center;">Error loading jobs: ${error.message}</div>`;
      return;
    }

    // Update admin stats if on admin page
    if (hash === '#admin' && sessionStorage.getItem('adminAuthed') === 'true') {
      const totalJobsSpan = document.getElementById('total-jobs');
      if (totalJobsSpan) totalJobsSpan.textContent = jobs?.length.toString() || '0';

      // Get total applications count
      const { data: allApps } = await supabase.from('applications').select('id');
      const totalAppsSpan = document.getElementById('total-applications');
      if (totalAppsSpan) totalAppsSpan.textContent = allApps?.length.toString() || '0';
    }

    const jobListings = document.getElementById('job-listings');
    const adminJobListings = document.getElementById('admin-job-listings');

    // --- SEARCH BAR LOGIC ---
    // Only add search bar for jobs page (not admin)
    if (jobListings && hash === '#jobs') {
      // Insert search bar and sort dropdown above job listings
      let searchBar = document.getElementById('job-search-bar');
      if (!searchBar) {
        searchBar = document.createElement('div');
        searchBar.id = 'job-search-bar';
        searchBar.style.display = 'flex';
        searchBar.style.justifyContent = 'center';
        searchBar.style.alignItems = 'center';
        searchBar.style.gap = '1rem';
        searchBar.style.margin = '1.2rem auto 1.5rem auto';
        searchBar.innerHTML = `
          <input id="job-search-input" type="text" placeholder="Search jobs by name..." 
            style="width:100%;max-width:320px;padding:0.7rem 1.2rem;background:#fff;border:2px solid #3b82f6;border-radius:8px;font-size:1.1rem;box-shadow:0 1px 4px rgba(60,80,180,0.07);color:#1a237e;font-weight:500;transition:border-color 0.2s;outline:none;"
            onfocus="this.style.borderColor='#1a237e'" onblur="this.style.borderColor='#3b82f6'"
          />
          <select id="job-sort-select" style="max-width:200px;padding:0.7rem 1.2rem;background:#fff;border:2px solid #3b82f6;border-radius:8px;font-size:1.05rem;color:#1a237e;font-weight:500;outline:none;">
            <option value="az">Sort: Title A-Z</option>
            <option value="za">Sort: Title Z-A</option>
            <option value="location">Sort: Location</option>
            <option value="worktype">Sort: Work Type</option>
            <option value="salary">Sort: Salary Range (Low to High)</option>
          </select>
        `;
        jobListings.parentElement?.insertBefore(searchBar, jobListings);
      }
    }

    // --- FILTERING LOGIC ---
    // Helper to render jobs with optional filter
    async function renderJobDropdowns(container: HTMLElement, jobs: any[], isAdmin: boolean, isLoggedIn: boolean = false, filter: string = '') {
      let filteredJobs = jobs;
      if (filter) {
        const filterLower = filter.toLowerCase();
        filteredJobs = jobs.filter(job => (job.title || '').toLowerCase().includes(filterLower));
      }
      // --- SORTING LOGIC ---
      const sortSelect = document.getElementById('job-sort-select') as HTMLSelectElement | null;
      let sortValue = sortSelect ? sortSelect.value : 'az';
      if (sortValue === 'az') {
        filteredJobs = filteredJobs.slice().sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      } else if (sortValue === 'za') {
        filteredJobs = filteredJobs.slice().sort((a, b) => (b.title || '').localeCompare(a.title || ''));
      } else if (sortValue === 'location') {
        filteredJobs = filteredJobs.slice().sort((a, b) => (a.location || '').localeCompare(b.location || ''));
      } else if (sortValue === 'worktype') {
        // Try to sort by work_type, fallback to workType or type
        const getType = (job: any) => job.work_type || job.workType || job.type || '';
        filteredJobs = filteredJobs.slice().sort((a, b) => getType(a).localeCompare(getType(b)));
      } else if (sortValue === 'salary') {
        // Parse the first number in the salary string for sorting
        const parseSalary = (salary: string | undefined) => {
          if (!salary) return Number.POSITIVE_INFINITY;
          // Remove $ , - and get the first number
          const match = salary.replace(/[$,]/g, '').match(/\d+/);
          return match ? parseInt(match[0], 10) : Number.POSITIVE_INFINITY;
        };
        filteredJobs = filteredJobs.slice().sort((a, b) => parseSalary(a.salary) - parseSalary(b.salary));
      }
      if (!filteredJobs || filteredJobs.length === 0) {
        container.innerHTML = `<div style="text-align:center;color:#1a237e;background:#e3e9f7;font-weight:600;margin:2rem 0;padding:1.2rem 0.5rem;border-radius:8px;">No job openings available${filter ? ' matching your search.' : ', come back soon!'} </div>`;
        return;
      }
      // Get application counts for each job if in admin mode
      let jobApplicationCounts: { [key: string]: number } = {};
      if (isAdmin) {
        for (const job of filteredJobs) {
          const jobId = job.id ?? job.ID ?? job.Id ?? job.job_id;
          if (jobId) {
            try {
              const { data: applications } = await supabase
                .from('applications')
                .select('id')
                .eq('job_id', jobId);
              jobApplicationCounts[jobId] = applications?.length || 0;
            } catch (error) {
              console.error('Error fetching application count for job:', jobId, error);
              jobApplicationCounts[jobId] = 0;
            }
          }
        }
      }
      container.innerHTML = filteredJobs.map((job) => {
        // Find the job's ID column
        const jobId = job.id ?? job.ID ?? job.Id ?? job.job_id;
        const applicationCount = isAdmin ? jobApplicationCounts[jobId] || 0 : 0;
        const applicationCountText = isAdmin ? `<span style="background:#e3e9f7;color:#072044;padding:0.3rem 0.8rem;border-radius:20px;font-size:0.85rem;font-weight:600;margin-left:0.5rem;">${applicationCount} application${applicationCount !== 1 ? 's' : ''}</span>` : '';
        // Render job type and location as plain text
        const jobType = job.work_type || job.workType || job.type || '';
        const jobLocation = job.location || '';
        return `
        <div class="job-card" data-job-id="${jobId ?? ''}" style="margin-bottom:2rem;">
          <button class="job-dropdown-toggle" style="width:100%;text-align:left;background:var(--light-gray);border:none;padding:1rem 1.2rem;border-radius:8px;font-size:1.1rem;font-weight:600;color:var(--primary-blue);cursor:pointer;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;flex-wrap:wrap;">
              <span>${job.title || '(No Title)'}</span>
              ${applicationCountText}
            </div>
            <span class="dropdown-arrow" style="font-size:1.2rem;">▼</span>
          </button>
          <div class="job-dropdown-content" style="display:none;padding:1.2rem 1.2rem 0.5rem 1.2rem;background:#fff;border-radius:0 0 8px 8px;border:1px solid #e3e9f7;border-top:none;color:#1a237e;">
            <div style="margin-bottom:0.7rem;font-size:1.05rem;color:#1a237e;font-weight:500;">
              ${jobType ? `<span style='margin-right:1.5rem;'><strong>Type:</strong> ${jobType}</span>` : ''}
              ${jobLocation ? `<span><strong>Location:</strong> ${jobLocation}</span>` : ''}
            </div>
            <p><strong>Description:</strong> ${job.description || '-'}</p>
            <p><strong>Required Skills/Education:</strong> ${job.required || '-'}</p>
            <p><strong>Recommended Skills/Education:</strong> ${job.recommended || '-'}</p>
            <p><strong>Salary Range:</strong> ${job.salary || '-'}</p>
            ${isAdmin ? `
              <div class="admin-job-actions" style="margin-top:1rem;display:flex;gap:0.8rem;flex-wrap:wrap;">
                <button class="view-applicants-btn" data-job-id="${jobId ?? ''}" data-job-title="${job.title || '(No Title)'}" style="background:var(--primary-blue);color:#fff;border:none;padding:0.6rem 1.2rem;border-radius:6px;cursor:pointer;font-weight:600;">
                  👥 View Applications
                </button>
                <button class="edit-job-btn" data-job-id="${jobId ?? ''}" style="background:#28a745;color:#fff;border:none;padding:0.6rem 1.2rem;border-radius:6px;cursor:pointer;font-weight:600;">
                  ✏️ Edit Job
                </button>
                <button class="delete-job-btn" data-job-id="${jobId ?? ''}" style="background:#dc3545;color:#fff;border:none;padding:0.6rem 1.2rem;border-radius:6px;cursor:pointer;font-weight:600;">
                  🗑️ Delete Job
                </button>
              </div>
            ` : isLoggedIn ? `
              <div class="job-actions" style="margin-top:1rem;display:flex;gap:0.8rem;flex-wrap:wrap;justify-content:center;">
                <button class="apply-job-btn" data-job-id="${jobId ?? ''}" style="background:var(--primary-blue);color:#fff;border:none;padding:0.6rem 1.2rem;border-radius:6px;cursor:pointer;font-weight:600;">
                  📝 Apply for this Position
                </button>
              </div>
            ` : `
              <div class="job-actions" style="margin-top:1rem;display:flex;gap:0.8rem;flex-wrap:wrap;justify-content:center;">
                <button class="login-to-apply-btn" style="background:#1976d2;color:#fff;border:none;padding:0.6rem 1.2rem;border-radius:6px;cursor:pointer;font-weight:600;">
                  🔐 Log In to Apply
                </button>
              </div>
            `}
          </div>
        </div>
        `;
      }).join('');
      // Dropdown logic
      container.querySelectorAll('.job-dropdown-toggle').forEach((btn) => {
        btn.addEventListener('click', function() {
          const content = (btn as HTMLElement).parentElement!.querySelector('.job-dropdown-content') as HTMLElement;
          const arrow = (btn as HTMLElement).querySelector('.dropdown-arrow') as HTMLElement;
          if (content.style.display === 'block') {
            content.style.display = 'none';
            arrow.textContent = '▼';
          } else {
            content.style.display = 'block';
            arrow.textContent = '▲';
          }
        });
      });
      // Admin actions
      if (isAdmin) {
        // View applicants logic
        container.querySelectorAll('.view-applicants-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const jobId = (btn as HTMLElement).getAttribute('data-job-id');
            const jobTitle = (btn as HTMLElement).getAttribute('data-job-title');
            if (jobId && jobTitle) {
              const { showApplicantsModal } = await import('./pages/admin.ts');
              await showApplicantsModal(jobId, jobTitle);
            }
          });
        });

        // Edit job logic
        container.querySelectorAll('.edit-job-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const jobId = (btn as HTMLElement).getAttribute('data-job-id');
            if (jobId) {
              try {
                // Fetch the job data from the database
                const { data: job, error } = await supabase
                  .from('jobs')
                  .select('*')
                  .eq('id', jobId)
                  .single();

                if (error) {
                  console.error('Error fetching job:', error);
                  alert('Error loading job data for editing.');
                  return;
                }

                if (job) {
                  showEditJobForm(job);
                }
              } catch (error) {
                console.error('Error loading job data:', error);
                alert('Error loading job data for editing.');
              }
            }
          });
        });

        // Delete logic
        container.querySelectorAll('.delete-job-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const jobId = (btn as HTMLElement).getAttribute('data-job-id');
            if (jobId) {
              if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
                const { error } = await supabase.from('jobs').delete().eq('id', jobId);
                if (!error) {
                  renderPage();
                } else {
                  alert('Error deleting job: ' + error.message);
                }
              }
            } else {
              alert('Error: No job ID found for this job.');
            }
          });
        });
      }

      // Apply button logic for logged-in users
      if (isLoggedIn && !isAdmin) {
        container.querySelectorAll('.apply-job-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const jobId = (btn as HTMLElement).getAttribute('data-job-id');
            if (jobId) {
              window.location.hash = `#apply-${jobId}`;
            } else {
              alert('Error: No job ID found for this job.');
            }
          });
        });
      }

      // Log in to apply button logic for non-authenticated users
      if (!isLoggedIn && !isAdmin) {
        container.querySelectorAll('.login-to-apply-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.hash = '#login';
          });
        });
      }
    }

    // Initial render (no filter)
    if (jobListings && hash === '#jobs') {
      await renderJobDropdowns(jobListings, jobs || [], false, isLoggedIn);
      // Add search input and sort select event listeners
      const searchInput = document.getElementById('job-search-input') as HTMLInputElement | null;
      const sortSelect = document.getElementById('job-sort-select') as HTMLSelectElement | null;
      if (searchInput) {
        searchInput.addEventListener('input', async () => {
          await renderJobDropdowns(jobListings, jobs || [], false, isLoggedIn, searchInput.value);
        });
      }
      if (sortSelect) {
        sortSelect.addEventListener('change', async () => {
          const filterValue = searchInput ? searchInput.value : '';
          await renderJobDropdowns(jobListings, jobs || [], false, isLoggedIn, filterValue);
        });
      }
    }
    if (adminJobListings && hash === '#admin') {
      await renderJobDropdowns(adminJobListings, jobs || [], true, isLoggedIn);
    }
  }
  // Show/hide job form in admin
  if (hash === '#admin' && sessionStorage.getItem('adminAuthed') === 'true') {
    const showJobFormBtn = document.getElementById('show-job-form-btn');
    const jobForm = document.getElementById('job-form') as HTMLFormElement | null;
    if (showJobFormBtn && jobForm) {
      showJobFormBtn.addEventListener('click', () => {
        jobForm.style.display = jobForm.style.display === 'block' ? 'none' : 'block';
        showJobFormBtn.textContent = jobForm.style.display === 'block' ? 'Hide Form' : 'Add New Job';
      });
    }
  }

  // Handle admin password form
  if (hash === '#admin' && !sessionStorage.getItem('adminAuthed')) {
    // Wait for DOM to be ready before adding event listener
    setTimeout(() => {
      const adminForm = document.getElementById('admin-auth-form') as HTMLFormElement | null;
      if (adminForm) {
        adminForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const pw = (document.getElementById('admin-password') as HTMLInputElement).value;
          const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'LADDER2025';
          if (pw === adminPassword) {
            sessionStorage.setItem('adminAuthed', 'true');
            // Instead of changing hash, re-render directly to avoid hashchange race
            renderPage();
          } else {
            const errorDiv = adminForm.querySelector('.login-error');
            if (errorDiv) errorDiv.textContent = 'Incorrect password.';
          }
        });
      }
    }, 0);
  }

  // Handle job form submission (admin only, after password)
  if (hash === '#admin' && sessionStorage.getItem('adminAuthed') === 'true') {
    const form = document.getElementById('job-form') as HTMLFormElement | null;
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = (document.getElementById('job-title') as HTMLInputElement).value.trim();
        const description = (document.getElementById('job-desc') as HTMLTextAreaElement).value.trim();
        const required = (document.getElementById('job-required') as HTMLTextAreaElement).value.trim();
        const recommended = (document.getElementById('job-recommended') as HTMLTextAreaElement).value.trim();
        const salary = (document.getElementById('job-salary') as HTMLInputElement).value.trim();
        const location = (document.getElementById('job-location') as HTMLInputElement).value.trim();
        const workType = (document.getElementById('job-work-type') as HTMLSelectElement).value;
        
        // Validate required fields
        if (!title || !description || !required || !workType) {
          alert('Please fill in all required fields (title, description, required skills, work type).');
          return;
        }
        
        const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
        const isEditing = submitBtn.getAttribute('data-editing') === 'true';
        const jobId = submitBtn.getAttribute('data-job-id');
        
        try {
          if (isEditing && jobId) {
            // Update existing job
            const { error } = await supabase
              .from('jobs')
              .update({ title, description, required, recommended, salary, location, work_type: workType })
              .eq('id', jobId);
              
            if (error) throw error;
            alert('Job updated successfully!');
          } else {
            // Create new job
            const { error } = await supabase
              .from('jobs')
              .insert([{ title, description, required, recommended, salary, location, work_type: workType }]);
              
            if (error) throw error;
            alert('Job created successfully!');
          }
          
          // Reset form and show/hide elements
          form.reset();
          form.style.display = 'none';
          const showFormBtn = document.getElementById('show-job-form-btn') as HTMLButtonElement;
          if (showFormBtn) showFormBtn.style.display = 'block';
          
          // Reset submit button
          submitBtn.innerHTML = '<span>🚀</span> Post Job';
          submitBtn.removeAttribute('data-job-id');
          submitBtn.removeAttribute('data-editing');
          
          // Update form title
          const formTitle = form.querySelector('h4');
          if (formTitle) formTitle.textContent = 'Create New Job Opening';
          
          // Reload the admin page
          window.location.hash = '#admin';
          
        } catch (error: any) {
          alert('Error saving job: ' + (error.message || JSON.stringify(error)));
        }
      });
    }
  }

  // Handle application form submission
  if (window.location.hash.startsWith('#apply-')) {
    const form = document.getElementById('application-form') as HTMLFormElement | null;
    if (form) {
      // Add character counter for elevator pitch
      const elevatorPitchTextarea = document.getElementById('app-elevator-pitch') as HTMLTextAreaElement;
      const pitchCounter = document.getElementById('pitch-count');
      if (elevatorPitchTextarea && pitchCounter) {
        elevatorPitchTextarea.addEventListener('input', () => {
          const count = elevatorPitchTextarea.value.length;
          pitchCounter.textContent = `${count}/300 characters`;
          pitchCounter.style.color = count > 250 ? '#e74c3c' : '#6b7280';
        });
      }

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
        const submitText = document.getElementById('submit-text') as HTMLElement;
        const submitLoading = document.getElementById('submit-loading') as HTMLElement;
        const errorDiv = document.getElementById('form-error') as HTMLElement;
        const successDiv = document.getElementById('form-success') as HTMLElement;
        
        // Show loading state
        submitBtn.disabled = true;
        submitText.style.display = 'none';
        submitLoading.style.display = 'inline';
        errorDiv.textContent = '';
        successDiv.style.display = 'none';
        
        try {
          // Get form data
          const prefix = (document.getElementById('app-prefix') as HTMLSelectElement).value;
          const name = (document.getElementById('app-name') as HTMLInputElement).value;
          const suffix = (document.getElementById('app-suffix') as HTMLSelectElement).value;
          const fullName = `${prefix} ${name} ${suffix}`.trim();
          const email = (document.getElementById('app-email') as HTMLInputElement).value;
          const phone = (document.getElementById('app-phone') as HTMLInputElement).value;
          const dob = (document.getElementById('app-dob') as HTMLInputElement).value;
          const street = (document.getElementById('app-street') as HTMLInputElement).value;
          const city = (document.getElementById('app-city') as HTMLInputElement).value;
          const state = (document.getElementById('app-state') as HTMLInputElement).value;
          const country = (document.getElementById('app-country') as HTMLSelectElement).value;
          const education = (document.getElementById('app-education') as HTMLSelectElement).value;
          const experience = (document.getElementById('app-experience') as HTMLTextAreaElement).value;
          const elevatorPitch = (document.getElementById('app-elevator-pitch') as HTMLTextAreaElement).value;
          const hearAbout = (document.getElementById('app-hear-about') as HTMLSelectElement).value;
          
          // Debug: Check if elevator pitch element exists and has value
          const elevatorPitchElement = document.getElementById('app-elevator-pitch') as HTMLTextAreaElement;
          console.log('Elevator pitch element found:', !!elevatorPitchElement);
          console.log('Elevator pitch raw value:', elevatorPitchElement?.value);
          console.log('Elevator pitch processed value:', elevatorPitch);
          const gender = (document.getElementById('app-gender') as HTMLSelectElement).value;
          const ethnicity = (document.getElementById('app-ethnicity') as HTMLSelectElement).value;
          const qualifications = (document.getElementById('app-qualifications') as HTMLInputElement).checked;
          const workEligible = (document.getElementById('app-work-eligibility') as HTMLInputElement).checked;
          const termsAccepted = (document.getElementById('app-terms') as HTMLInputElement).checked;
          const resumeFile = (document.getElementById('app-resume') as HTMLInputElement).files?.[0];
          
          if (!resumeFile) {
            throw new Error('Please select a resume file.');
          }
          
          const jobId = window.location.hash.replace('#apply-', '');
          
          // Submit application
          await submitApplication({
            jobId,
            name: fullName,
            email,
            phone,
            dob,
            street,
            city,
            state,
            country,
            education,
            experience,
            elevatorPitch,
            hearAbout,
            gender,
            ethnicity,
            qualifications,
            workEligible,
            termsAccepted,
            resumeFile
          });
          
          // Show success
          successDiv.style.display = 'block';
          form.reset();
          
          // Redirect to jobs page after a delay
          setTimeout(() => {
            window.location.hash = '#jobs';
          }, 2000);
          
        } catch (error: any) {
          errorDiv.textContent = error.message || 'An error occurred while submitting your application.';
        } finally {
          // Reset button state
          submitBtn.disabled = false;
          submitText.style.display = 'inline';
          submitLoading.style.display = 'none';
        }
      });
      
      // Handle back to jobs button
      const backBtn = document.getElementById('back-to-jobs');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          window.location.hash = '#jobs';
        });
      }
    }
  }

  // Add logout button handler if logged in
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await logoutUser();
    });
  }

  // Add Application Status tab to account dropdown if logged in
  if (isLoggedIn) {
    const accountDropdown = document.getElementById('account-dropdown');
    if (accountDropdown && !document.getElementById('app-status-btn')) {
      const appStatusBtn = document.createElement('button');
      appStatusBtn.id = 'app-status-btn';
      appStatusBtn.textContent = 'Application Status';
      appStatusBtn.style.width = '100%';
      appStatusBtn.style.background = 'none';
      appStatusBtn.style.border = 'none';
      appStatusBtn.style.padding = '0.7rem 1rem';
      appStatusBtn.style.textAlign = 'left';
      appStatusBtn.style.color = '#1a237e';
      appStatusBtn.style.fontSize = '1rem';
      appStatusBtn.style.cursor = 'pointer';
      accountDropdown.insertBefore(appStatusBtn, accountDropdown.firstChild);
      appStatusBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        // Remove any existing modal before creating a new one
        const oldModal = document.getElementById('app-status-modal');
        if (oldModal) oldModal.remove();
        // Show application status modal/page
        const user = await getCurrentUser();
        if (!user) return;
        let html = `<div style='padding:2.2rem 2.2rem 1.2rem 2.2rem;max-width:600px;min-width:340px;'>` +
          `<h2 style='margin-bottom:1.2rem;text-align:center;font-size:2rem;font-weight:700;color:#1a237e;'>Your Applications</h2>` +
          `<div style='height:3px;width:100%;background:linear-gradient(90deg,#3b82f6 60%,#fff 100%);margin-bottom:2rem;border-radius:2px;'></div>`;
        let apps: any[] = [];
        let appsError = false;
        try {
          apps = await getUserApplications(user.id);
        } catch {
          appsError = true;
        }
        if (appsError) {
          html += `<div style='color:#c00;background:#fff3f3;padding:1.2rem 1rem;border-radius:8px;text-align:center;font-weight:600;'>Could not load your applications.</div>`;
        } else if (!apps.length) {
          html += `<div style='color:#1a237e;background:#e3e9f7;padding:1.2rem 1rem;border-radius:8px;text-align:center;font-weight:600;'>No jobs applied to yet! Why not change that?</div>`;
        } else {
          html += `<div style='display:flex;flex-direction:column;gap:1.2rem;'>`;
          for (const app of apps) {
            let jobTitle = '';
            try {
              const { data: job } = await supabase.from('jobs').select('title').eq('id', app.job_id).single();
              jobTitle = job?.title || '(Unknown Job)';
            } catch { jobTitle = '(Unknown Job)'; }
            // Status badge color
            let badgeColor = '#e0e0e0', badgeText = '#222', badgeBorder = '#bbb', boxBorder = '#b5d0ff', boxBg = '#f6f9ff';
            if ((app.status || '').toLowerCase() === 'accepted') {
              badgeColor = '#a7f3d0'; badgeText = '#065f46'; badgeBorder = '#10b981';
              boxBorder = '#10b981'; boxBg = '#d1fae5';
            } else if ((app.status || '').toLowerCase() === 'submitted') {
              badgeColor = '#ffe6a0'; badgeText = '#b97a00'; badgeBorder = '#ffc43a';
              boxBorder = '#ffc43a'; boxBg = '#fffbe6';
            } else if ((app.status || '').toLowerCase() === 'under review') {
              badgeColor = '#93c5fd'; badgeText = '#1e3a8a'; badgeBorder = '#2563eb';
              boxBorder = '#2563eb'; boxBg = '#dbeafe';
            } else if ((app.status || '').toLowerCase() === 'interview') {
              badgeColor = '#d8b4fe'; badgeText = '#7c3aed'; badgeBorder = '#8b5cf6';
              boxBorder = '#8b5cf6'; boxBg = '#e9d5ff';
            } else if ((app.status || '').toLowerCase() === 'rejected' || (app.status || '').toLowerCase() === 'denied') {
              badgeColor = '#dc2626'; badgeText = '#ffffff'; badgeBorder = '#dc2626';
              boxBorder = '#dc2626'; boxBg = '#fef2f2';
            }
            html += `
              <div style="background:${boxBg};border:2.5px solid ${boxBorder};border-radius:14px;padding:1.1rem 1.5rem;box-shadow:0 2px 8px rgba(60,80,180,0.07);display:flex;align-items:center;gap:1.2rem;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:0.7rem;font-size:1.18rem;font-weight:600;color:#1a237e;">
                  <span>${jobTitle}</span>
                  <span style="font-weight:400;font-size:1.05rem;color:#6b7280;">- Status:</span>
                </div>
                <span style="display:inline-block;padding:0.5rem 1.5rem;font-size:1.08rem;font-weight:700;background:${badgeColor};color:${badgeText};border:2px solid ${badgeBorder};border-radius:24px;letter-spacing:1px;box-shadow:0 1px 4px rgba(0,0,0,0.04);text-transform:uppercase;">${(app.status || 'SUBMITTED').toUpperCase()}</span>
              </div>
            `;
          }
          html += `</div>`;
        }
        html += `<div style='display:flex;justify-content:center;'><button id='close-app-status' style='margin-top:2.2rem;background:#1a237e;color:#fff;border:none;padding:0.7rem 2.2rem;border-radius:8px;cursor:pointer;font-size:1.1rem;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>Close</button></div></div>`;
        // Modal
        let modal = document.createElement('div');
        modal.id = 'app-status-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.18)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '1000';
        modal.innerHTML = `<div style='background:#fff;border-radius:18px;box-shadow:0 2px 24px rgba(0,0,0,0.13);'>${html}</div>`;
        document.body.appendChild(modal);
        // Close button handler
        const closeBtn = document.getElementById('close-app-status');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            modal.remove();
          });
        }
      });
    }
  }
}

// Initial render
renderPage();

// Listen for hash changes to re-render the page
window.addEventListener('hashchange', () => {
  renderPage();
});

// --- Debugging and Testing Helpers ---
// Uncomment this section to enable debug logging for Supabase responses
/*
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  console.log('Session data:', session);
});

supabase.from('jobs').on('*', payload => {
  console.log('Jobs table change:', payload);
}).subscribe();

supabase.from('applications').on('*', payload => {
  console.log('Applications table change:', payload);
}).subscribe();
*/

// For testing: Auto-fill resume upload and application submit (remove in production)
/*
document.getElementById('test-upload-resume')?.addEventListener('click', async () => {
  const fileInput = document.getElementById('resume-file') as HTMLInputElement;
  const userId = (await getCurrentUser())?.id;
  const jobId = 'example-job-id'; // Replace with a valid job ID for testing
  if (fileInput && userId) {
    const file = fileInput.files?.[0];
    if (file) {
      try {
        const path = await uploadResume(file, userId, jobId);
        alert('Resume uploaded to: ' + path);
      } catch (error) {
        alert('Error uploading resume: ' + error.message);
      }
    } else {
      alert('No file selected.');
    }
  } else {
    alert('User not logged in or invalid job ID.');
  }
});

document.getElementById('test-submit-app')?.addEventListener('click', async () => {
  const user = await getCurrentUser();
  const jobId = 'example-job-id'; // Replace with a valid job ID for testing
  if (user) {
    try {
      await submitApplication({
        jobId,
        name: user.email.split('@')[0],
        email: user.email,
        phone: '123-456-7890',
        age: 25,
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        country: 'United States',
        education: "Bachelor's Degree",
        experience: 'Test work experience',
        elevatorPitch: 'Test elevator pitch',
        hearAbout: 'Company Website',
        gender: 'Male',
        ethnicity: 'Other',
        qualifications: true,
        workEligible: true,
        termsAccepted: true,
        resumeFile: null // Set a valid File object here if needed
      });
      alert('Application submitted (check console for details)');
    } catch (error) {
      alert('Error submitting application: ' + error.message);
    }
  } else {
    alert('User not logged in.');
  }
});
*/

// ...existing code...
// ...existing code...

// ...existing code...