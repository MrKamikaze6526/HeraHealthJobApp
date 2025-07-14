// Jobs page module
// Exports renderJobs for the jobs page

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
