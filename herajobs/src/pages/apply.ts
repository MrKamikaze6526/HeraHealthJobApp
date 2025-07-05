// Application form page module
// Exports renderApply for the application form page
import { supabase } from '../main';

export async function renderApply(jobId: string): Promise<string> {
  // Fetch job info
  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single();
  return `
    <section class="hero apply-hero">
      <div class="container">
        <h2 style="color: #fff; margin-bottom: 2rem;">Apply for: ${job?.title || '(Unknown Job)'}</h2>
        <div class="apply-form-container">
          <form id="application-form">
            <div class="form-section">
              <h3>Personal Information</h3>
              
              <div class="form-row-group">
                <div class="form-row">
                  <label for="app-prefix">Prefix</label>
                  <select id="app-prefix" name="app-prefix">
                    <option value="">Select...</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Prof.">Prof.</option>
                  </select>
                </div>
                <div class="form-row flex-grow">
                  <label for="app-name">Full Name <span style="color: #e74c3c;">*</span></label>
                  <input type="text" id="app-name" name="app-name" required placeholder="Enter your full name" />
                </div>
                <div class="form-row">
                  <label for="app-suffix">Suffix</label>
                  <select id="app-suffix" name="app-suffix">
                    <option value="">Select...</option>
                    <option value="Jr.">Jr.</option>
                    <option value="Sr.">Sr.</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="PhD">PhD</option>
                    <option value="MD">MD</option>
                  </select>
                </div>
              </div>
              
              <label for="app-email">Email Address <span style="color: #e74c3c;">*</span></label>
              <input type="email" id="app-email" name="app-email" required placeholder="your@email.com" />
              
              <label for="app-phone">Phone Number <span style="color: #e74c3c;">*</span></label>
              <input type="tel" id="app-phone" name="app-phone" required placeholder="(555) 123-4567" />
              
              <label for="app-age">Age <span style="color: #e74c3c;">*</span></label>
              <input type="number" id="app-age" name="app-age" required min="16" max="100" placeholder="25" />
            </div>
            
            <div class="form-section">
              <h3>Address Information</h3>
              
              <label for="app-street">Street Address <span style="color: #e74c3c;">*</span></label>
              <input type="text" id="app-street" name="app-street" required placeholder="123 Main Street" />
              
              <div class="form-row-group">
                <div class="form-row">
                  <label for="app-city">City <span style="color: #e74c3c;">*</span></label>
                  <input type="text" id="app-city" name="app-city" required placeholder="Boston" />
                </div>
                <div class="form-row">
                  <label for="app-state">State <span style="color: #e74c3c;">*</span></label>
                  <input type="text" id="app-state" name="app-state" required placeholder="MA" />
                </div>
                <div class="form-row">
                  <label for="app-country">Country <span style="color: #e74c3c;">*</span></label>
                  <select id="app-country" name="app-country" required>
                    <option value="">Select...</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="form-section">
              <h3>Professional Information</h3>
              
              <label for="app-education">Education <span style="color: #e74c3c;">*</span></label>
              <select id="app-education" name="app-education" required>
                <option value="">Select highest level...</option>
                <option value="High School">High School</option>
                <option value="Associate Degree">Associate Degree</option>
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="Doctoral Degree">Doctoral Degree</option>
                <option value="Professional Degree">Professional Degree</option>
              </select>
              
              <label for="app-experience">Work Experience <span style="color: #e74c3c;">*</span></label>
              <textarea id="app-experience" name="app-experience" required rows="4" placeholder="Describe your relevant work experience..."></textarea>
              
              <label for="app-resume">Resume <span style="color: #e74c3c;">*</span></label>
              <input type="file" id="app-resume" name="app-resume" accept=".pdf,.doc,.docx" required />
              <div class="file-info">
                <small>Accepted formats: PDF, DOC, DOCX (Max 10MB)</small>
              </div>
            </div>
            
            <div class="form-section">
              <h3>Additional Information</h3>
              
              <label for="app-hear-about">How did you hear about us? <span style="color: #e74c3c;">*</span></label>
              <select id="app-hear-about" name="app-hear-about" required>
                <option value="">Select...</option>
                <option value="Company Website">Company Website</option>
                <option value="Job Board">Job Board</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Social Media">Social Media</option>
                <option value="Referral">Referral from Employee/Friend</option>
                <option value="University Career Center">University Career Center</option>
                <option value="Job Fair">Job Fair</option>
                <option value="Other">Other</option>
              </select>
              
              <label for="app-gender">Gender</label>
              <select id="app-gender" name="app-gender">
                <option value="">Prefer not to answer</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
              </select>
              
              <label for="app-ethnicity">Ethnicity</label>
              <select id="app-ethnicity" name="app-ethnicity">
                <option value="">Prefer not to answer</option>
                <option value="American Indian or Alaska Native">American Indian or Alaska Native</option>
                <option value="Asian">Asian</option>
                <option value="Black or African American">Black or African American</option>
                <option value="Hispanic or Latino">Hispanic or Latino</option>
                <option value="Native Hawaiian or Other Pacific Islander">Native Hawaiian or Other Pacific Islander</option>
                <option value="White">White</option>
                <option value="Two or more races">Two or more races</option>
              </select>
            </div>
            
            <div class="form-section">
              <h3>Legal Certifications</h3>
              
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="app-qualifications" name="app-qualifications" required />
                  <span class="checkmark"></span>
                  I certify that I meet the qualifications stated in the job description <span style="color: #e74c3c;">*</span>
                </label>
              </div>
              
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="app-work-eligibility" name="app-work-eligibility" required />
                  <span class="checkmark"></span>
                  I am legally able to work in the country where this position is located <span style="color: #e74c3c;">*</span>
                </label>
              </div>
              
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="app-terms" name="app-terms" required />
                  <span class="checkmark"></span>
                  I agree to the Terms and Conditions (will be provided during interview process) <span style="color: #e74c3c;">*</span>
                </label>
              </div>
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
