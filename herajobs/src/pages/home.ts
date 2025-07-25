// Home page module for Hera Health Solutions job app
/**
 * home.ts
 *
 * Renders the home page for Hera Health Solutions job application SPA.
 *
 * Exports:
 * - renderHome: Render the home page HTML
 *
 * Author: Hera Health Solutions
 * Last updated: 2025-07-22
 */

/**
 * Render the home page.
 * @returns HTML string for the home page
 */
export function renderHome() {
  return `
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
        </div>
      </div>
    </section>
  `;
}
