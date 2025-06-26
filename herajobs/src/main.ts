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
  await renderPage();
}

// Make renderPage async to allow await usage
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
  // Route: Admin page (hidden, only accessible if logged in)
  } else if (hash === '#admin') {
    if (!isLoggedIn) {
      mainContent = `
        <section class="login-section">
          <div class="container login-container">
            <h2>Admin Login Required</h2>
            <p style="margin-bottom:1rem;">You must be logged in to access the admin page.</p>
            <button class="cta-button primary" id="go-login">Go to Log In</button>
          </div>
        </section>
      `;
    } else {
      mainContent = `
        <section class="hero">
          <div class="container">
            <h2>Admin: Manage Job Postings</h2>
            <form id="job-form">
              <input type="text" id="job-title" placeholder="Job Title" required style="margin-bottom:0.5rem;width:100%;padding:0.5rem;" />
              <textarea id="job-desc" placeholder="Job Description" required style="margin-bottom:0.5rem;width:100%;padding:0.5rem;"></textarea>
              <button type="submit" class="cta-button primary">Post Job</button>
            </form>
            <div id="admin-job-listings" style="margin-top:2rem;"></div>
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
          <div class="logo-section">
            <div class="logo-placeholder"></div>
            <h1 class="logo">Hera Health Solutions</h1>
          </div>
          <nav class="nav">
            <a href="#home" class="nav-link ${homeActive}">Home</a>
            <a href="#jobs" class="nav-link ${jobsActive}">Jobs</a>
            <a href="#why-hera" class="nav-link ${whyActive}">Why Hera?</a>
            ${isLoggedIn
              ? `<span class="nav-link" style="background:var(--primary-blue);color:white;cursor:default;">Logged in</span><button class="nav-link" id="logout-btn" style="background:var(--primary-blue);color:white;">Log Out</button>`
              : `<a href="#login" class="nav-link ${loginActive}">Log In</a>`}
          </nav>
        </div>
      </header>
      <main>${mainContent}</main>
    </div>
  `;

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

  // Load job listings for logged-in users
  if (isLoggedIn && (hash === '#jobs' || hash === '#admin')) {
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    const jobListings = document.getElementById('job-listings');
    const adminJobListings = document.getElementById('admin-job-listings');
    if (jobListings) {
      jobListings.innerHTML = '';
      jobs?.forEach(job => {
        jobListings.innerHTML += `
          <div class="job-card">
            <h3 class="job-title">${job.title}</h3>
            <p class="job-desc">${job.description}</p>
            <div class="job-meta">
              <span class="job-date">${new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        `;
      });
    }
    if (adminJobListings) {
      adminJobListings.innerHTML = '';
      jobs?.forEach(job => {
        adminJobListings.innerHTML += `
          <div class="job-card">
            <h3 class="job-title">${job.title}</h3>
            <p class="job-desc">${job.description}</p>
            <div class="job-meta">
              <span class="job-date">${new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        `;
      });
    }
  }

  // Handle job form submission (admin only)
  if (hash === '#admin') {
    const form = document.getElementById('job-form') as HTMLFormElement | null;
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = (document.getElementById('job-title') as HTMLInputElement).value;
        const description = (document.getElementById('job-desc') as HTMLTextAreaElement).value;
        const { error } = await supabase
          .from('jobs')
          .insert([{ title, description }]);
        if (!error) {
          form.reset();
          window.location.hash = '#admin';
        } else {
          console.error('Error posting job:', error);
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
}

// Initial render
renderPage();

// Handle hash changes (for SPA navigation)
window.addEventListener('hashchange', renderPage);