// Jobs page module
// Exports renderJobs for the jobs page
import { supabase } from './main';

export async function renderJobs(isLoggedIn: boolean): Promise<string> {
  if (!isLoggedIn) {
    return `
      <section class="login-section">
        <div class="container login-container">
          <h2>Login Required</h2>
          <p style="margin-bottom:1rem;">You must be logged in to access job postings.</p>
          <button class="cta-button primary" id="go-login">Go to Log In</button>
        </div>
      </section>
    `;
  }
  return `
    <section class="hero">
      <div class="container">
        <h2>Open Positions</h2>
        <div id="job-listings"></div>
      </div>
    </section>
  `;
}
