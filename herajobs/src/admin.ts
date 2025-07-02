// Admin page module
// Exports renderAdmin for the admin page
import { supabase, getJobApplications, updateApplicationStatus, getResumeUrl } from './main';

// Helper: Download resume file
export async function downloadResume(resumePath: string, applicantName: string): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from('resumes')
      .download(resumePath);
    
    if (error) {
      console.error('Download error:', error);
      if (error.message.includes('Bucket not found')) {
        throw new Error('File storage is not available. Please contact support.');
      } else if (error.message.includes('not found')) {
        throw new Error('Resume file not found. It may have been deleted.');
      } else {
        throw new Error('Failed to download resume. Please try again.');
      }
    }
    
    if (!data) {
      throw new Error('No file data received. Please try again.');
    }
    
    // Create download link
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${applicantName.replace(/[^a-zA-Z0-9]/g, '_')}_resume.${resumePath.split('.').pop()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('Resume downloaded successfully');
  } catch (error: any) {
    console.error('Resume download error:', error);
    alert('Error downloading resume: ' + (error.message || error));
  }
}

// Helper: Render applicants modal
export async function showApplicantsModal(jobId: string, jobTitle: string): Promise<void> {
  try {
    const apps = await getJobApplications(jobId);
    
    let html = `
      <div class="applicants-modal-content">
        <div class="modal-header">
          <h3>Applications for: ${jobTitle}</h3>
          <button id="close-applicants" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
    `;
    
    if (!apps.length) {
      html += `
        <div class="no-applicants">
          <p>No applications received yet for this position.</p>
        </div>
      `;
    } else {
      html += `
        <div class="applicants-list">
          <div class="applicants-header">
            <span>Total Applications: <strong>${apps.length}</strong></span>
          </div>
      `;
      
      for (const app of apps) {
        const submittedDate = new Date(app.submitted_at).toLocaleDateString();
        html += `
          <div class="applicant-card">
            <div class="applicant-info">
              <div class="applicant-name">${app.name}</div>
              <div class="applicant-contact">
                <span>📧 ${app.email}</span>
                <span>📞 ${app.phone}</span>
              </div>
              <div class="applicant-date">Applied: ${submittedDate}</div>
            </div>
            <div class="applicant-actions">
              <div class="status-section">
                <label>Status:</label>
                <select data-app-id='${app.id}' class='status-select'>
                  <option value='submitted' ${app.status==='submitted'?'selected':''}>Submitted</option>
                  <option value='under review' ${app.status==='under review'?'selected':''}>Under Review</option>
                  <option value='interview' ${app.status==='interview'?'selected':''}>Interview</option>
                  <option value='accepted' ${app.status==='accepted'?'selected':''}>Accepted</option>
                  <option value='denied' ${app.status==='denied'?'selected':''}>Denied</option>
                </select>
              </div>
              <div class="resume-section">
                ${app.resume_path ? `
                  <button class="download-btn" data-resume-path='${app.resume_path}' data-name='${app.name}'>
                    📄 Download Resume
                  </button>
                  <a href='${getResumeUrl(app.resume_path)}' target='_blank' class="view-btn">
                    👁️ View Online
                  </a>
                ` : '<span class="no-resume">No resume uploaded</span>'}
              </div>
            </div>
          </div>
        `;
      }
      html += `</div>`;
    }
    
    html += `
        </div>
      </div>
    `;
    
    // Create and show modal
    const modal = document.createElement('div');
    modal.id = 'applicants-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = html;
    document.body.appendChild(modal);
    
    // Event listeners
    document.getElementById('close-applicants')?.addEventListener('click', () => {
      modal.remove();
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
    // Status change handlers
    modal.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', async () => {
        const appId = (select as HTMLSelectElement).getAttribute('data-app-id');
        const status = (select as HTMLSelectElement).value;
        if (appId) {
          try {
            await updateApplicationStatus(appId, status);
            // Show success feedback
            const card = select.closest('.applicant-card') as HTMLElement;
            if (card) {
              card.style.background = '#e8f5e8';
              setTimeout(() => {
                card.style.background = '';
              }, 1000);
            }
          } catch (err: any) {
            alert('Error updating status: ' + (err.message || err));
          }
        }
      });
    });
    
    // Download handlers
    modal.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const resumePath = btn.getAttribute('data-resume-path');
        const name = btn.getAttribute('data-name');
        if (resumePath && name) {
          await downloadResume(resumePath, name);
        }
      });
    });
    
  } catch (error: any) {
    alert('Error loading applications: ' + (error.message || error));
  }
}

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
    <section class="hero admin-hero">
      <div class="container">
        <h2>Admin Dashboard: Job Management</h2>
        <div class="admin-stats">
          <div class="stat-card">
            <h4>Job Openings</h4>
            <span id="total-jobs">Loading...</span>
          </div>
          <div class="stat-card">
            <h4>Total Applications</h4>
            <span id="total-applications">Loading...</span>
          </div>
        </div>
        <div id="admin-job-listings" style="margin-bottom:2rem;"></div>
        <button id="show-job-form-btn" class="cta-button primary" style="margin-bottom:1.5rem;">Add New Job</button>
        <form id="job-form" class="admin-job-form" style="display:none;">
          <div class="form-row">
            <input type="text" id="job-title" placeholder="Job Title" required />
          </div>
          <div class="form-row">
            <textarea id="job-desc" placeholder="Job Description" required rows="4"></textarea>
          </div>
          <div class="form-row">
            <textarea id="job-required" placeholder="Required Skills/Education" required rows="3"></textarea>
          </div>
          <div class="form-row">
            <textarea id="job-recommended" placeholder="Recommended Skills/Education" rows="3"></textarea>
          </div>
          <div class="form-row">
            <input type="text" id="job-salary" placeholder="Salary (e.g. $60,000 - $80,000)" />
          </div>
          <button type="submit" class="cta-button primary">Post Job</button>
        </form>
      </div>
    </section>
  `;
}
