// Import global styles
import './style.css'
import { createClient } from '@supabase/supabase-js';
import { renderHome } from './pages/home.ts';
import { renderWhyHera } from './pages/why-hera.ts';
import { renderJobs } from './pages/jobs.ts';
import { renderAdmin } from './pages/admin.ts';
import { renderApply } from './pages/apply.ts';

// Import setup utilities
import { setupResumesBucket } from './supabase-setup.ts';

// Initialize Supabase client
const supabaseUrl = 'https://fgiddweoaadwbbagywer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnaWRkd2VvYWFkd2JiYWd5d2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4OTA4MDAsImV4cCI6MjA2NjQ2NjgwMH0.T6dOkxWChS5VVhtris1rGbL7m8VReGf2-x9Ou7Hstdg';
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
export async function submitApplication({ jobId, name, email, phone, resumeFile }: { jobId: string, name: string, email: string, phone: string, resumeFile: File }): Promise<void> {
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
    const { error } = await supabase.from('applications').insert([
      {
        job_id: jobId,
        user_id: user.id,
        name,
        email,
        phone,
        resume_path: resumePath,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      }
    ]);
    
    if (error) {
      console.error('Application submission error:', error);
      
      // Handle specific error cases
      if (error.message.includes('row-level security')) {
        throw new Error('Database security policy error. Please contact support or check the RLS setup guide.');
      } else if (error.message.includes('duplicate key')) {
        throw new Error('You have already applied to this position.');
      } else if (error.message.includes('foreign key')) {
        throw new Error('Invalid job ID. Please refresh the page and try again.');
      } else {
        throw new Error(`Application submission failed: ${error.message}`);
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
  const { data, error } = await supabase.from('applications').select('*').eq('job_id', jobId);
  if (error) throw new Error(error.message);
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
    mainContent = await renderJobs(isLoggedIn);
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
            <div class="logo-placeholder"></div>
            <h1 class="logo">Hera Health Solutions</h1>
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

  // Load job listings for logged-in users and admin
  if ((isLoggedIn && (hash === '#jobs')) || (hash === '#admin' && sessionStorage.getItem('adminAuthed') === 'true')) {
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
    // Render jobs as dropdowns or show empty message
    async function renderJobDropdowns(container: HTMLElement, jobs: any[], isAdmin: boolean) {
      if (!jobs || jobs.length === 0) {
        container.innerHTML = `<div style="text-align:center;color:#1a237e;background:#e3e9f7;font-weight:600;margin:2rem 0;padding:1.2rem 0.5rem;border-radius:8px;">No job openings available, come back soon!</div>`;
        return;
      }
      
      // Get application counts for each job if in admin mode
      let jobApplicationCounts: { [key: string]: number } = {};
      if (isAdmin) {
        for (const job of jobs) {
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
      
      container.innerHTML = jobs.map((job) => {
        // Find the job's ID column
        const jobId = job.id ?? job.ID ?? job.Id ?? job.job_id;
        const applicationCount = isAdmin ? jobApplicationCounts[jobId] || 0 : 0;
        const applicationCountText = isAdmin ? `<span style="background:#e3e9f7;color:#072044;padding:0.3rem 0.8rem;border-radius:20px;font-size:0.85rem;font-weight:600;margin-left:0.5rem;">${applicationCount} application${applicationCount !== 1 ? 's' : ''}</span>` : '';
        
        return `
        <div class="job-card" data-job-id="${jobId ?? ''}" style="margin-bottom:1.2rem;">
          <button class="job-dropdown-toggle" style="width:100%;text-align:left;background:var(--light-gray);border:none;padding:1rem 1.2rem;border-radius:8px;font-size:1.1rem;font-weight:600;color:var(--primary-blue);cursor:pointer;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;flex-wrap:wrap;">
              <span>${job.title || '(No Title)'}</span>
              ${applicationCountText}
            </div>
            <span class="dropdown-arrow" style="font-size:1.2rem;">▼</span>
          </button>
          <div class="job-dropdown-content" style="display:none;padding:1.2rem 1.2rem 0.5rem 1.2rem;background:#fff;border-radius:0 0 8px 8px;border:1px solid #e3e9f7;border-top:none;color:#1a237e;">
            <p><strong>Description:</strong> ${job.description || '-'}</p>
            <p><strong>Required Skills/Education:</strong> ${job.required || '-'}</p>
            <p><strong>Recommended Skills/Education:</strong> ${job.recommended || '-'}</p>
            <p><strong>Salary:</strong> ${job.salary || '-'}</p>
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
            ` : ''}
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
    }
    if (jobListings && hash === '#jobs') {
      await renderJobDropdowns(jobListings, jobs || [], false);
    }
    if (adminJobListings && hash === '#admin') {
      await renderJobDropdowns(adminJobListings, jobs || [], true);
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
          if (pw === 'LADDER2025') {
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
        // Show application status modal/page
        const user = await getCurrentUser();
        if (!user) return;
        let html = `<div style='padding:1.5rem;max-width:500px;'><h3 style='margin-bottom:1rem;'>Your Applications</h3>`;
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
          html += `<ul style='list-style:none;padding:0;'>`;
          for (const app of apps) {
            let jobTitle = '';
            try {
              const { data: job } = await supabase.from('jobs').select('title').eq('id', app.job_id).single();
              jobTitle = job?.title || '(Unknown Job)';
            } catch { jobTitle = '(Unknown Job)'; }
            html += `<li style='margin-bottom:1.2rem;'><strong>${jobTitle}</strong><br>Status: <span style='font-weight:600;'>${app.status || 'submitted'}</span></li>`;
          }
          html += `</ul>`;
        }
        html += `<button id='close-app-status' style='margin-top:1.5rem;background:#1a237e;color:#fff;border:none;padding:0.5rem 1.2rem;border-radius:6px;cursor:pointer;'>Close</button></div>`;
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
        modal.innerHTML = `<div style='background:#fff;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,0.13);'>${html}</div>`;
        document.body.appendChild(modal);
        document.getElementById('close-app-status')?.addEventListener('click', () => {
          modal.remove();
        });
      });
    }
  }
  // Jobs page: add Apply button for each job
  if (isLoggedIn && (window.location.hash === '#jobs')) {
    const jobListings = document.getElementById('job-listings');
    if (jobListings) {
      // Wait for jobs to render
      setTimeout(() => {
        jobListings.querySelectorAll('.job-card').forEach(card => {
          const jobId = card.getAttribute('data-job-id');
          if (!card.querySelector('.apply-btn')) {
            const btn = document.createElement('button');
            btn.textContent = 'Apply';
            btn.className = 'cta-button primary apply-btn';
            btn.style.marginTop = '1rem';
            btn.addEventListener('click', () => {
              window.location.hash = `#apply-${jobId}`;
            });
            card.querySelector('.job-dropdown-content')?.appendChild(btn);
          }
        });
      }, 0);
    }
  }
  // Apply pages already handled by renderApply module via the main routing above
  if (window.location.hash.startsWith('#apply-')) {
    // Application form submission logic - add event listener after page is rendered
    setTimeout(() => {
      const appForm = document.getElementById('application-form') as HTMLFormElement | null;
      const backBtn = document.getElementById('back-to-jobs');
      const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
      const submitText = document.getElementById('submit-text');
      const submitLoading = document.getElementById('submit-loading');
      const errorDiv = document.getElementById('form-error');
      const successDiv = document.getElementById('form-success');
      const jobId = window.location.hash.replace('#apply-', '');
      
      if (backBtn) backBtn.addEventListener('click', () => { window.location.hash = '#jobs'; });
      
      if (appForm) {
        appForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          // Show loading state
          if (submitBtn) submitBtn.disabled = true;
          if (submitText) submitText.style.display = 'none';
          if (submitLoading) submitLoading.style.display = 'inline';
          if (errorDiv) errorDiv.textContent = '';
          if (successDiv) successDiv.style.display = 'none';
          
          try {
            const name = (document.getElementById('app-name') as HTMLInputElement).value.trim();
            const email = (document.getElementById('app-email') as HTMLInputElement).value.trim();
            const phone = (document.getElementById('app-phone') as HTMLInputElement).value.trim();
            const resumeInput = document.getElementById('app-resume') as HTMLInputElement;
            const resumeFile = resumeInput.files && resumeInput.files[0];
            
            // Validation
            if (!name || !email || !phone) {
              throw new Error('Please fill in all required fields.');
            }
            
            if (!resumeFile) {
              throw new Error('Please upload your resume.');
            }
            
            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(resumeFile.type)) {
              throw new Error('Please upload a PDF, DOC, or DOCX file only.');
            }
            
            // Validate file size
            if (resumeFile.size > 10485760) {
              throw new Error('File size must be less than 10MB.');
            }
            
            // Submit application
            await submitApplication({ jobId, name, email, phone, resumeFile });
            
            // Show success
            appForm.reset();
            if (successDiv) successDiv.style.display = 'block';
            
            // Auto-redirect after 3 seconds
            setTimeout(() => {
              window.location.hash = '#jobs';
            }, 3000);
            
          } catch (err: any) {
            console.error('Application submission error:', err);
            let errorMessage = err.message || 'Error submitting application.';
            
            // Handle specific error cases with helpful messages
            if (errorMessage.includes('row-level security')) {
              errorMessage = '🔒 Database security error: Please check the RLS troubleshooting guide or contact support.';
            } else if (errorMessage.includes('storage') || errorMessage.includes('bucket')) {
              errorMessage = '📁 File storage error: Please run setupResumesBucket() in console or contact support.';
            } else if (errorMessage.includes('not logged in')) {
              errorMessage = '🔐 Please log in first before submitting an application.';
            }
            
            if (errorDiv) {
              errorDiv.innerHTML = errorMessage;
              errorDiv.style.color = '#e74c3c';
              
              // Add helpful diagnostic button for RLS errors
              if (errorMessage.includes('security error')) {
                const diagButton = document.createElement('button');
                diagButton.textContent = '🔍 Run Diagnostic';
                diagButton.style.marginTop = '0.5rem';
                diagButton.style.padding = '0.3rem 0.8rem';
                diagButton.style.fontSize = '0.8rem';
                diagButton.style.background = '#3498db';
                diagButton.style.color = 'white';
                diagButton.style.border = 'none';
                diagButton.style.borderRadius = '4px';
                diagButton.style.cursor = 'pointer';
                diagButton.onclick = () => {
                  console.log('🔍 Running diagnostic...');
                  if ((window as any).runFullSystemTest) {
                    (window as any).runFullSystemTest();
                  } else {
                    console.log('❌ Diagnostic tools not loaded. Load admin-test.js first.');
                  }
                };
                errorDiv.appendChild(document.createElement('br'));
                errorDiv.appendChild(diagButton);
              }
            }
          } finally {
            // Reset loading state
            if (submitBtn) submitBtn.disabled = false;
            if (submitText) submitText.style.display = 'inline';
            if (submitLoading) submitLoading.style.display = 'none';
          }
        });
      }
    }, 0);
    return;
  }
}

renderPage();

// --- Dev Only: Debugging ---
(window as any).supabase = supabase; // Expose supabase to browser console for debugging
(window as any).setupResumesBucket = setupResumesBucket; // Expose setup function for manual bucket creation

// --- Navigation: Only re-render on hashchange ---
window.onhashchange = () => {
  renderPage();
};
// Remove all direct renderPage() calls after navigation changes (e.g., after logout, after login/register, after admin password form)
// Instead, just change window.location.hash and let the hashchange event trigger renderPage