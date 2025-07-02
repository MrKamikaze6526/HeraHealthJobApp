// Admin page module
// Exports renderAdmin for the admin page
import { supabase } from './main';

export function renderAdmin(adminAuthed: boolean): string {
  if (!adminAuthed) {
    return `
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
  }
  return `
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
