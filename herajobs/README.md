
# Hera Health Solutions Job Application Portal

## Deployment
All features are published and hosted on [Render](https://render.com/). The live site URL will be provided by the project owner or IT team.

## Features
- **Job Listings:** Browse all open positions with search and sort options.
- **Job Application:** Apply online with a detailed form and resume upload (PDF, DOC, DOCX).
- **User Authentication:** Register and log in to apply and track your applications.
- **Application Status:** Logged-in users can view the status of their applications.
- **Admin Dashboard:** Secure admin area for posting/editing jobs, viewing applicants, and managing application statuses.

## Adding to Wix
To add the job portal to your Wix website:
1. **Get the Render deployment link** (e.g., `https://your-app.onrender.com`).
2. In Wix Editor, add a button or menu item where you want the job portal link.
3. Set the button's link to the Render URL. (Open in a new tab is recommended.)
4. Optionally, use Wix's HTML iframe/embed widget to embed the portal, but linking is simpler and more robust.

## How Each Page Works
- **Home:** Welcome page with company info and a button to view open positions.
- **Jobs:** Lists all available jobs. Users can search, sort, and view job details. "Apply" button is shown for logged-in users.
- **Apply:** Application form for a selected job. Users must be logged in to access. Includes personal info, experience, and resume upload.
- **Why Hera:** Company mission, story, and background.
- **Login/Register:** User authentication for applicants.
- **Application Status:** (In account menu) Shows logged-in users the status of all their applications.
- **Admin:** Password-protected dashboard for job and application management.

## Admin Access
- Go to the `/admin` page (e.g., `https://your-app.onrender.com/#admin`).
- Enter the admin password (provided separately) to access the dashboard.
- Admins can:
  - Add, edit, or delete job postings
  - View all applications for each job
  - Update application statuses (e.g., Under Review, Interview, Accepted, Denied)
  - Download or view applicant resumes

## Other Notes
- **Security:** Only authorized admins should have the admin password. All applicant data is stored securely in Supabase.
- **Resume Storage:** Uploaded resumes are stored in a secure Supabase bucket and can be downloaded by admins.
- **Support:** For technical issues, contact the project maintainer or IT team.

---

*For IT and web admins: See `README-IT-INTEGRATION.md` for technical deployment and configuration details.*
