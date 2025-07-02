// Application form page module
// Exports renderApply for the application form page
import { supabase } from './main';

export async function renderApply(jobId: string): Promise<string> {
  // Fetch job info
  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single();
  return `
    <section class="hero apply-hero">
      <div class="container">
        <h2 style="color: #fff; margin-bottom: 2rem;">Apply for: ${job?.title || '(Unknown Job)'}</h2>
        <div class="apply-form-container">
          <form id="application-form">
            <label for="app-name">Full Name <span style="color: #e74c3c;">*</span></label>
            <input type="text" id="app-name" name="app-name" required placeholder="Enter your full name" />
            
            <label for="app-email">Email Address <span style="color: #e74c3c;">*</span></label>
            <input type="email" id="app-email" name="app-email" required placeholder="your@email.com" />
            
            <label for="app-phone">Phone Number <span style="color: #e74c3c;">*</span></label>
            <input type="tel" id="app-phone" name="app-phone" required placeholder="(555) 123-4567" />
            
            <label for="app-resume">Resume <span style="color: #e74c3c;">*</span></label>
            <input type="file" id="app-resume" name="app-resume" accept=".pdf,.doc,.docx" required />
            <div class="file-info">
              <small>Accepted formats: PDF, DOC, DOCX (Max 10MB)</small>
            </div>
            
            <button type="submit" class="cta-button primary" id="submit-btn">
              <span id="submit-text">Submit Application</span>
              <span id="submit-loading" style="display: none;">⏳ Submitting...</span>
            </button>
            
            <div class="login-error" id="form-error"></div>
            <div class="success-message" id="form-success" style="display: none; color: #27ae60; font-weight: 600; text-align: center; margin-top: 1rem;">
              ✅ Application submitted successfully!
            </div>
          </form>
          <button id="back-to-jobs">← Back to Jobs</button>
        </div>
      </div>
    </section>
  `;
}
