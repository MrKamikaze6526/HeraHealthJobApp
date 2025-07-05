// Jobs page module
// Exports renderJobs for the jobs page

export async function renderJobs(isLoggedIn: boolean): Promise<string> {
  return `
    <section class="hero">
      <div class="container">
        <h2>Open Positions</h2>
        ${!isLoggedIn ? `
          <div class="login-notice">
            <p>📋 Browse our open positions below. <a href="#login" style="color: #1976d2; text-decoration: underline; font-weight: 600; background-color: rgba(255, 255, 255, 0.9); padding: 2px 6px; border-radius: 4px;">Log in</a> to apply for any position that interests you.</p>
          </div>
        ` : ''}
        <div id="job-listings"></div>
      </div>
    </section>
  `;
}
