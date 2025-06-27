// Import global styles
import './style.css'
import { createClient } from '@supabase/supabase-js';

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

// Helper: Upload resume to Supabase Storage
async function uploadResume(file: File, userId: string, jobId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const filePath = `resumes/${userId}_${jobId}_${Date.now()}.${fileExt}`;
  const { error } = await supabase.storage.from('resumes').upload(filePath, file, { upsert: true });
  if (error) throw new Error(error.message);
  return filePath;
}

// Helper: Get public URL for resume
export function getResumeUrl(path: string): string {
  const { data } = supabase.storage.from('resumes').getPublicUrl(path);
  return data.publicUrl;
}

// Helper: Submit application
export async function submitApplication({ jobId, name, email, phone, resumeFile }: { jobId: string, name: string, email: string, phone: string, resumeFile: File }): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not logged in');
  let resumePath = '';
  if (resumeFile) {
    resumePath = await uploadResume(resumeFile, user.id, jobId);
  }
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
  if (error) throw new Error(error.message);
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

// --- Extend renderPage for applicant features ---
async function renderPage() {
  // Check login status from Supabase session
  const isLoggedIn = await checkLoggedIn();
  // Get the current hash route, default to #home
  const hash = window.location.hash || '#home';
  // Track which nav link is active
  let mainContent = '';
  let homeActive = '', jobsActive = '', whyActive = '', loginActive = '';

  // Route: Jobs page
  if (hash === '#jobs') {
    // Only allow access if logged in
    if (!isLoggedIn) {
      mainContent = `
        <section class="login-section">
          <div class="container login-container">
            <h2>Login Required</h2>
            <p style="margin-bottom:1rem;">You must be logged in to access job postings.</p>
            <button class="cta-button primary" id="go-login">Go to Log In</button>
          </div>
        </section>
      `;
    } else {
      jobsActive = 'active';
      mainContent = `
        <section class="hero">
          <div class="container">
            <h2>Open Positions</h2>
            <div id="job-listings"></div>
          </div>
        </section>
      `;
    }
  // Route: Why Hera page
  } else if (hash === '#why-hera') {
    whyActive = 'active';
    mainContent = `
      <section class="hero">
        <div class="container">
          <h2>Why Hera?</h2>
          <p>Discover what makes Hera Health Solutions a great place to work.</p>
        </div>
      </section>
    `;
  // Route: Log In page
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
  // Route: Register page
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
  // Route: Admin page (password-only, not user login)
  } else if (hash === '#admin') {
    // Check if admin is authenticated in this session
    const adminAuthed = sessionStorage.getItem('adminAuthed') === 'true';
    if (adminAuthed) {
      // jobs fetch removed as it is not used directly here
    }
    if (!adminAuthed) {
      mainContent = `
        <section class="login-section">
          <div class="container login-container">
            <h2>Admin Access</h2>
            <form id="admin-auth-form">
              <label for="admin-password">Admin Password</label>
              <input type="password" id="admin-password" name="admin-password" required placeholder="Enter admin password" />
              <button type="submit" class="cta-button primary">Enter Admin</button>
              <div class="login-error" style="color:#c00;margin-top:0.5rem;"></div>
            </form>
          </div>
        </section>
      `;
    } else {
      mainContent = `
        <section class="hero">
          <div class="container">
            <h2>Admin: Job Opportunities</h2>
            <div id="admin-job-listings" style="margin-bottom:2rem;"></div>
            <button id="show-job-form-btn" class="cta-button primary" style="margin-bottom:1.5rem;">Add New Job</button>
            <form id="job-form" style="display:none;">
              <input type="text" id="job-title" placeholder="Job Title" required style="margin-bottom:0.5rem;width:100%;padding:0.5rem;" />
              <textarea id="job-desc" placeholder="Job Description" required style="margin-bottom:0.5rem;width:100%;padding:0.5rem;"></textarea>
              <textarea id="job-required" placeholder="Required Skills/Education" required style="margin-bottom:0.5rem;width:100%;padding:0.5rem;"></textarea>
              <textarea id="job-recommended" placeholder="Recommended Skills/Education" style="margin-bottom:0.5rem;width:100%;padding:0.5rem;"></textarea>
              <input type="text" id="job-salary" placeholder="Salary (e.g. $60,000 - $80,000)" style="margin-bottom:0.5rem;width:100%;padding:0.5rem;" />
              <button type="submit" class="cta-button primary">Post Job</button>
            </form>
          </div>
        </section>
      `;
    }
  // Default route: Home page
  } else {
    homeActive = 'active';
    mainContent = `
      <section class="hero">
        <div class="container">
          <h2>Track Your Career Journey</h2>
          <p>Organize, monitor, and stay updated on your job applications at Hera Health Solutions. Take the next step in your professional growth with a team dedicated to innovation and impact.</p>
          <div class="hero-buttons">
            <button class="cta-button secondary">View Open Positions</button>
          </div>
        </div>
      </section>
      <section class="features">
        <div class="container">
          <h3>Why Track Your Career with Hera?</h3>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🧬</div>
              <h4>Innovative Research</h4>
              <p>Be part of a team advancing long-acting treatments and bioerodible drug delivery technology.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌍</div>
              <h4>Global Impact</h4>
              <p>Help unlock the true potential of therapeutics for patients worldwide.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🤝</div>
              <h4>Collaborative Culture</h4>
              <p>Work with passionate professionals dedicated to improving patient outcomes.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔔</div>
              <h4>Stay Notified</h4>
              <p>Get instant updates on your application status and new opportunities at Hera.</p>
            </div>
          </div>
        </div>
      </section>
    `;
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
    const jobListings = document.getElementById('job-listings');
    const adminJobListings = document.getElementById('admin-job-listings');
    // Render jobs as dropdowns or show empty message
    function renderJobDropdowns(container: HTMLElement, jobs: any[], isAdmin: boolean) {
      if (!jobs || jobs.length === 0) {
        container.innerHTML = `<div style="text-align:center;color:#1a237e;background:#e3e9f7;font-weight:600;margin:2rem 0;padding:1.2rem 0.5rem;border-radius:8px;">No job openings available, come back soon!</div>`;
        return;
      }
      container.innerHTML = jobs.map((job) => {
        // Find the job's ID column
        const jobId = job.id ?? job.ID ?? job.Id ?? job.job_id;
        return `
        <div class="job-card" data-job-id="${jobId ?? ''}" style="margin-bottom:1.2rem;">
          <button class="job-dropdown-toggle" style="width:100%;text-align:left;background:var(--light-gray);border:none;padding:1rem 1.2rem;border-radius:8px;font-size:1.1rem;font-weight:600;color:var(--primary-blue);cursor:pointer;display:flex;align-items:center;justify-content:space-between;">
            <span>${job.title || '(No Title)'}</span>
            <span class="dropdown-arrow" style="font-size:1.2rem;">▼</span>
          </button>
          <div class="job-dropdown-content" style="display:none;padding:1.2rem 1.2rem 0.5rem 1.2rem;background:#fff;border-radius:0 0 8px 8px;border:1px solid #e3e9f7;border-top:none;color:#1a237e;">
            <p><strong>Description:</strong> ${job.description || '-'}</p>
            <p><strong>Required Skills/Education:</strong> ${job.required || '-'}</p>
            <p><strong>Recommended Skills/Education:</strong> ${job.recommended || '-'}</p>
            <p><strong>Salary:</strong> ${job.salary || '-'}</p>
            ${isAdmin ? `<button class="delete-job-btn" data-job-id="${jobId ?? ''}" style="margin-top:1rem;background:#c00;color:#fff;border:none;padding:0.3rem 0.8rem;border-radius:6px;cursor:pointer;">Delete</button>` : ''}
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
      // Delete logic for admin
      if (isAdmin) {
        container.querySelectorAll('.delete-job-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const jobId = (btn as HTMLElement).getAttribute('data-job-id');
            if (jobId) {
              const { error } = await supabase.from('jobs').delete().eq('id', jobId);
              if (!error) {
                renderPage();
              } else {
                alert('Error deleting job: ' + error.message);
              }
            } else {
              alert('Error: No job ID found for this job.');
            }
          });
        });
      }
    }
    if (jobListings && hash === '#jobs') {
      renderJobDropdowns(jobListings, jobs || [], false);
    }
    if (adminJobListings && hash === '#admin') {
      renderJobDropdowns(adminJobListings, jobs || [], true);
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
        // Validate required fields
        if (!title || !description || !required) {
          alert('Please fill in all required fields (title, description, required skills).');
          return;
        }
        const { error, status, statusText } = await supabase
          .from('jobs')
          .insert([{ title, description, required, recommended, salary }]);
        if (!error) {
          form.reset();
          window.location.hash = '#admin';
        } else {
          alert('Error posting job: ' + (error.message || JSON.stringify(error) || statusText || status));
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
  // Application form page
  if (window.location.hash.startsWith('#apply-')) {
    const jobId = window.location.hash.replace('#apply-', '');
    // Fetch job info
    const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single();
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
      <div class="homepage">
        <header class="header">
          <div class="container nav-container">
            <div class="logo-section" id="home-logo-btn" style="cursor:pointer;">
              <div class="logo-placeholder"></div>
              <h1 class="logo">Hera Health Solutions</h1>
            </div>
            <nav class="nav">
              <a href="#home" class="nav-link">Home</a>
              <a href="#jobs" class="nav-link active">Jobs</a>
              <a href="#why-hera" class="nav-link">Why Hera?</a>
              <div class="nav-link account-menu" style="position:relative;">
                <button id="account-btn" style="background:var(--primary-blue);color:white;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;border:none;cursor:pointer;">
                  <span style="font-size:1.3rem;">👤</span>
                </button>
                <div id="account-dropdown" style="display:none;position:absolute;right:0;top:48px;background:white;border:1px solid #e3e9f7;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);min-width:120px;z-index:10;">
                  <button id="logout-btn" style="width:100%;background:none;border:none;padding:0.7rem 1rem;text-align:left;color:#1a237e;font-size:1rem;cursor:pointer;">Log Out</button>
                </div>
              </div>
            </nav>
          </div>
        </header>
        <main>
          <section class="hero">
            <div class="container">
              <h2>Apply for: ${job?.title || '(Unknown Job)'}</h2>
              <form id="application-form" style="max-width:480px;margin:2rem auto 0 auto;background:#f7f9fc;padding:2rem 1.5rem;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                <label for="app-name">Full Name</label>
                <input type="text" id="app-name" name="app-name" required style="margin-bottom:0.7rem;width:100%;padding:0.5rem;" />
                <label for="app-email">Email</label>
                <input type="email" id="app-email" name="app-email" required style="margin-bottom:0.7rem;width:100%;padding:0.5rem;" />
                <label for="app-phone">Phone Number</label>
                <input type="tel" id="app-phone" name="app-phone" required style="margin-bottom:0.7rem;width:100%;padding:0.5rem;" />
                <label for="app-resume">Resume (PDF, DOC, DOCX)</label>
                <input type="file" id="app-resume" name="app-resume" accept=".pdf,.doc,.docx" required style="margin-bottom:1.2rem;" />
                <button type="submit" class="cta-button primary">Submit Application</button>
                <div class="login-error" style="color:#c00;margin-top:0.5rem;"></div>
              </form>
              <button id="back-to-jobs" style="margin-top:2rem;background:#1a237e;color:#fff;border:none;padding:0.5rem 1.2rem;border-radius:6px;cursor:pointer;">Back to Jobs</button>
            </div>
          </section>
        </main>
      </div>
    `;
    // Logo home
    const homeLogoBtn = document.getElementById('home-logo-btn');
    if (homeLogoBtn) homeLogoBtn.addEventListener('click', () => { window.location.hash = '#home'; });
    // Account menu
    const accountBtn = document.getElementById('account-btn');
    const accountDropdown = document.getElementById('account-dropdown');
    if (accountBtn && accountDropdown) {
      accountBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        accountDropdown.style.display = accountDropdown.style.display === 'block' ? 'none' : 'block';
      });
      document.addEventListener('click', () => { accountDropdown.style.display = 'none'; });
      accountDropdown.addEventListener('click', (e) => { e.stopPropagation(); });
    }
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => { e.preventDefault(); await logoutUser(); });
    }
    // Back to jobs
    const backBtn = document.getElementById('back-to-jobs');
    if (backBtn) backBtn.addEventListener('click', () => { window.location.hash = '#jobs'; });
    // Application form submit
    const appForm = document.getElementById('application-form') as HTMLFormElement | null;
    if (appForm) {
      appForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = (document.getElementById('app-name') as HTMLInputElement).value.trim();
        const email = (document.getElementById('app-email') as HTMLInputElement).value.trim();
        const phone = (document.getElementById('app-phone') as HTMLInputElement).value.trim();
        const resumeInput = document.getElementById('app-resume') as HTMLInputElement;
        const resumeFile = resumeInput.files && resumeInput.files[0];
        const errorDiv = appForm.querySelector('.login-error');
        if (!name || !email || !phone || !resumeFile) {
          if (errorDiv) errorDiv.textContent = 'Please fill in all fields and upload your resume.';
          return;
        }
        try {
          await submitApplication({ jobId, name, email, phone, resumeFile });
          appForm.reset();
          if (errorDiv) (errorDiv as HTMLElement).style.color = '#1a237e';
          if (errorDiv) errorDiv.textContent = 'Application submitted!';
        } catch (err: any) {
          if (errorDiv) errorDiv.textContent = err.message || 'Error submitting application.';
        }
      });
    }
    return;
  }
  // Admin: show applicants for each job, allow status change
  if (window.location.hash === '#admin' && sessionStorage.getItem('adminAuthed') === 'true') {
    setTimeout(() => {
      const adminJobListings = document.getElementById('admin-job-listings');
      if (adminJobListings) {
        adminJobListings.querySelectorAll('.job-card').forEach(card => {
          const jobId = card.getAttribute('data-job-id');
          if (!card.querySelector('.view-applicants-btn')) {
            const btn = document.createElement('button');
            btn.textContent = 'View Applicants';
            btn.className = 'cta-button secondary view-applicants-btn';
            btn.style.marginTop = '1rem';
            btn.addEventListener('click', async () => {
              // Fetch applicants
              const apps = await getJobApplications(jobId!);
              let html = `<div style='padding:1.5rem;max-width:600px;'><h3 style='margin-bottom:1rem;'>Applicants</h3>`;
              if (!apps.length) {
                html += `<div style='color:#1a237e;background:#e3e9f7;padding:1rem;border-radius:8px;text-align:center;'>No applicants yet.</div>`;
              } else {
                html += `<ul style='list-style:none;padding:0;'>`;
                for (const app of apps) {
                  html += `<li style='margin-bottom:1.2rem;'><strong>${app.name}</strong> (${app.email}, ${app.phone})<br>Status: <select data-app-id='${app.id}' class='status-select' style='margin-left:0.5rem;'>
                    <option value='submitted' ${app.status==='submitted'?'selected':''}>submitted</option>
                    <option value='under review' ${app.status==='under review'?'selected':''}>under review</option>
                    <option value='accepted' ${app.status==='accepted'?'selected':''}>accepted</option>
                    <option value='denied' ${app.status==='denied'?'selected':''}>denied</option>
                  </select><br>
                  Resume: ${app.resume_path ? `<a href='${getResumeUrl(app.resume_path)}' target='_blank' style='color:#1a237e;text-decoration:underline;'>View Resume</a>` : 'No resume uploaded'}
                  </li>`;
                }
                html += `</ul>`;
              }
              html += `<button id='close-applicants' style='margin-top:1.5rem;background:#1a237e;color:#fff;border:none;padding:0.5rem 1.2rem;border-radius:6px;cursor:pointer;'>Close</button></div>`;
              // Modal
              let modal = document.createElement('div');
              modal.id = 'applicants-modal';
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
              document.getElementById('close-applicants')?.addEventListener('click', () => {
                modal.remove();
              });
              // Status change
              modal.querySelectorAll('.status-select').forEach(sel => {
                sel.addEventListener('change', async () => {
                  const appId = (sel as HTMLSelectElement).getAttribute('data-app-id');
                  const status = (sel as HTMLSelectElement).value;
                  if (appId) {
                    try {
                      await updateApplicationStatus(appId, status);
                    } catch (err: any) {
                      alert('Error updating status: ' + (err.message || err));
                    }
                  }
                });
              });
            });
            card.querySelector('.job-dropdown-content')?.appendChild(btn);
          }
        });
      }
    }, 0);
  }
}

renderPage();

// --- Dev Only: Debugging ---
(window as any).supabase = supabase; // Expose supabase to browser console for debugging

// --- Navigation: Only re-render on hashchange ---
window.onhashchange = () => {
  renderPage();
};
// Remove all direct renderPage() calls after navigation changes (e.g., after logout, after login/register, after admin password form)
// Instead, just change window.location.hash and let the hashchange event trigger renderPage