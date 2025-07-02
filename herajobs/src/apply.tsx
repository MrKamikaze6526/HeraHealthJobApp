// Application form page module
// Exports renderApply for the application form page
import { supabase } from './main';

export async function renderApply(jobId: string): Promise<string> {
  // Fetch job info
  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single();
  return `
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
  `;
}
