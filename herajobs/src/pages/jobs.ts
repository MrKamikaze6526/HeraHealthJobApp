// Jobs page module
// Exports renderJobs for the jobs page

/**
 * jobs.ts
 *
 * Renders the jobs listing page for Hera Health Solutions SPA.
 *
 * Exports:
 * - renderJobs: Render the jobs page HTML
 *
 * Author: Hera Health Solutions
 * Last updated: 2025-07-22
 */

/**
 * Render the jobs listing page.
 * @returns HTML string for the jobs page
 */
export async function renderJobs(): Promise<string> {
  return `
    <section class="hero">
      <div class="container">
        <h2>Open Positions</h2>
        <div id="job-listings" style="margin-top: 3rem;"></div>
      </div>
    </section>
  `;
}
