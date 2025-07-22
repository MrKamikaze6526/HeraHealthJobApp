
# Hera Health Solutions Job Application Portal Integration


## Deployment
All features are published and hosted on [Render](https://render.com/). The live site URL will be provided by the project owner or IT team. Currently at heracareers.onrender.com

---

## Prerequisites: Installing Node.js, Vite, and React

This project is built with [Vite](https://vitejs.dev/) (a fast frontend build tool) and [React](https://react.dev/) for the UI. You need Node.js and npm to run and build the project locally or on Render.

### 1. Install Node.js and npm

- Download and install Node.js (which includes npm) from [nodejs.org](https://nodejs.org/). Use the LTS (Long Term Support) version for best compatibility.
- After installation, check your versions:

```sh
node --version
npm --version
```

### 2. Install Vite and React (Project Dependencies)

You do **not** need to install Vite or React globally. They are included as dependencies in this project. When you run `npm install`, both Vite and React (and all other dependencies) will be installed automatically based on the `package.json` file.

### 3. How Vite/React Tie Into Render Deployment

- **Vite** is used for both local development (`npm run dev`) and building the production site (`npm run build`).
- **React** is the JavaScript framework used for the UI components and pages.
- When you deploy to Render, Render will run the build command (`npm install && npm run build`) to generate the static files in the `dist/` folder. These are then served as your live website.
- The start command (`npm run preview` or a static site host) tells Render how to serve the built site.

**Summary of Build Commands:**

- `npm install` — Installs all dependencies (including Vite, React, etc.)
- `npm run dev` — Starts a local development server (for previewing changes)
- `npm run build` — Builds the production-ready static site (output in `dist/`)
- `npm run preview` — Serves the built site locally (used by Render for preview/static hosting)

---

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


## Supabase & Data Management
- All applicant and job data, as well as uploaded resumes, are securely managed using [Supabase](https://supabase.com/).
- Supabase handles authentication, database storage, and file storage for resumes.
- **Credentials & Access:** The supervisor of this project will have all Supabase project credentials and access. IT and web admins do not need to set up or modify Supabase directly.
- **Security:** Only authorized admins should have the admin password. All applicant data is stored securely in Supabase, and resume files are only accessible to admins.
- **Resume Storage:** Uploaded resumes are stored in a secure Supabase bucket and can be downloaded by admins.

## Support
- For technical issues, contact the project maintainer, IT team, or the project supervisor.


## Removing the Home or Why Hera Pages

If you want to remove the **Home** or **Why Hera** pages from the portal:

### To Remove the Home Page:
1. Delete or rename the file `src/pages/home.ts`.
2. Remove any navigation links or buttons that point to the Home page in your navigation/menu code (typically in your main layout or navigation component).
3. If Home is the default route, set another page (e.g., Jobs) as the default in your routing logic.

### To Remove the Why Hera Page:
1. Delete or rename the file `src/pages/why-hera.ts`.
2. Remove any navigation links or buttons that point to the Why Hera page in your navigation/menu code.

After making these changes, rebuild and redeploy the project to update the live site.

---

## How to Modify and Publish This Portal on Render (Step-by-Step)

This section explains how to make changes to the code, configure environment variables, and deploy your own version of the portal using [Render](https://render.com/).

### 1. Prerequisites

- A [Render](https://render.com/) account (free or paid)
- Access to the Supabase project (for database, authentication, and storage)
- The admin password (for admin dashboard access)
- Basic knowledge of Git and Node.js (recommended)

### 2. Clone or Fork the Repository

Clone this repository to your local machine, or fork it on GitHub and then clone your fork:

```sh
git clone https://github.com/YourOrgOrUser/HeraHealthJobApp.git
cd HeraHealthJobApp/herajobs
```

### 3. Install Dependencies

Install Node.js dependencies:

```sh
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the `herajobs` directory (or use Render's dashboard to set these as environment variables):

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_ADMIN_PASSWORD=your-admin-password
```

- **VITE_SUPABASE_URL**: Found in your Supabase project settings (API > Project URL)
- **VITE_SUPABASE_ANON_KEY**: Found in your Supabase project settings (API > anon public key)
- **VITE_ADMIN_PASSWORD**: Set this to any strong password you want for admin access

**On Render:** Go to your service > Environment > Add Environment Variable for each of the above.

### 5. Make Code Changes

- Edit any files in the `src/` directory to change pages, styles, or logic.
- Update `src/pages/home.ts`, `src/pages/why-hera.ts`, or other page files as needed.
- Change styles in `src/style.css`.
- Update navigation/menu in `src/main.ts` if you add or remove pages.
- Test locally by running:

```sh
npm run dev
```

Visit `http://localhost:5173` to preview your changes.

### 6. Commit and Push Changes

If you forked or cloned from GitHub, commit and push your changes:

```sh
git add .
git commit -m "Describe your changes"
git push origin main
```

### 7. Deploy on Render

#### Option 1: Connect GitHub Repo
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New Web Service**
3. Connect your GitHub repo (or fork)
4. Set the root directory to `herajobs` if prompted
5. Set the build command: `npm install && npm run build`
6. Set the start command: `npm run preview` (for static preview) or use a static site build if using Vite
7. Add the environment variables as described above
8. Click **Create Web Service**

#### Option 2: Manual Deploy (Static Export)
1. Run `npm run build` locally
2. Upload the contents of the `dist/` folder to a static site host (Render Static Site, Netlify, Vercel, etc.)
3. Set environment variables as needed in the host dashboard

### 8. Updating the Live Site

Any time you make changes, push to your main branch (or redeploy in Render) to update the live site.

### 9. Troubleshooting

- **Build Fails:** Check that all environment variables are set and correct.
- **Supabase Errors:** Make sure your Supabase URL and anon key are correct and the Supabase project is active.
- **Admin Login Not Working:** Ensure the admin password matches the one set in your environment variables.
- **Static Assets Not Loading:** If using a static host, make sure all files in `dist/` are uploaded and paths are correct.

---