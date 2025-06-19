// Import global styles
import './style.css'

// Simple in-memory authentication state (resets on refresh)
let isLoggedIn = false;

// Main function to render the current page based on the hash route
function renderPage() {
  // Get the current hash route, default to #home
  const hash = window.location.hash || '#home';
  // Track which nav link is active
  let mainContent = '';
  let homeActive = '', jobsActive = '', whyActive = '', loginActive = '';

  // Route: Jobs page
  if (hash === '#jobs') {
    jobsActive = 'active';
    mainContent = `
      <section class="hero">
        <div class="container">
          <h2>Open Positions</h2>
          <div id="job-listings"></div>
        </div>
      </section>
    `;
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
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required autocomplete="username" placeholder="you@email.com" />
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="Create a password" />
            <button type="submit" class="cta-button primary">Log In</button>
            <div class="login-error" style="color:#c00;margin-top:0.5rem;"></div>
          </form>
        </div>
      </section>
    `;
  // Route: Admin page (hidden, only accessible if logged in)
  } else if (hash === '#admin') {
    if (!isLoggedIn) {
      // If not logged in, show a prompt to log in
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
      // If logged in, show the admin job posting form
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
            <a href="#login" class="nav-link ${loginActive}">Log In</a>
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

  // Handle login form submission (demo: any email/password logs in)
  if (hash === '#login') {
    const form = document.querySelector('.login-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        // For demo: any email/password logs in
        isLoggedIn = true;
        window.location.hash = '#admin';
      });
    }
  }

  // If not logged in, allow user to go to login from admin lock page
  if (hash === '#admin' && !isLoggedIn) {
    const btn = document.getElementById('go-login');
    if (btn) {
      btn.addEventListener('click', () => {
        window.location.hash = '#login';
      });
    }
  }

  // Handle admin job posting form submission (UI only, no backend yet)
  if (hash === '#admin' && isLoggedIn) {
    const form = document.getElementById('job-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Job posting functionality coming soon!');
      });
    }
  }
}

// Listen for hash changes and initial page load to render the correct page
window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', renderPage);