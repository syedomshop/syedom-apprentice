# Syedom Labs Internship Portal

## Overview
A React + Supabase internship management platform for Syedom Labs. Interns can register, receive tasks, submit work, and earn certificates. Admins can manage interns, grade submissions, and automate notifications.

## Architecture
- **Frontend**: React 18 + TypeScript + Vite, hosted on Replit
- **Backend / Auth / Database**: Supabase (existing project: `tmsxfbrszqwsppmbkmmd`)
- **Edge Functions**: Supabase Edge Functions (Deno) for email, AI grading, task generation
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: TanStack React Query + React Context (AuthContext)

## Key Features
- Intern registration with seat-limit enforcement and waitlist
- Role-based routing: interns → `/intern/*`, admins → `/admin/*`
- AI-powered task generation (Gemini API) via Supabase edge function
- AI grading of submissions via Supabase edge function
- Offer letter emails + confirmation via Resend API (Supabase edge functions)
- Certificate issuance on completion
- Admin dashboard: interns, tasks, submissions, grading, notifications, batches

## Project Structure
```
src/
  App.tsx                  — Routes and providers
  contexts/AuthContext.tsx — Supabase auth state
  lib/supabaseClient.ts    — Supabase client (reads from env vars)
  integrations/supabase/   — Auto-generated Supabase types + client
  pages/
    Landing.tsx / Login.tsx / Register.tsx / VerifyCertificate.tsx
    intern/  — Dashboard, Tasks, Submissions, Grades
    admin/   — Dashboard, Interns, Tasks, Submissions, Grading, + more
  components/
    layout/  — AdminLayout, PortalLayout
    admin/   — Admin-specific UI components
    ui/      — shadcn/ui primitives
supabase/
  schema.sql               — Full database schema
  migrations/              — Incremental SQL migrations
  functions/               — Edge functions (Deno): send-confirmation,
                             process-pending-offers, generate-tasks,
                             grade-submission, send-admin-notification
```

## Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL (set in Replit secrets)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key (set in Replit secrets)

Edge function secrets (configured in Supabase dashboard):
- `GEMINI_API_KEY` — Google Gemini AI for task generation and grading
- `RESEND_API_KEY` — Resend for transactional emails
- `SUPABASE_SERVICE_ROLE_KEY` — Auto-injected by Supabase edge runtime

## Development
```bash
npm run dev     # Start Vite dev server on port 5000
npm run build   # Production build
```

## Admin Access
Admin emails are configured in `src/lib/adminConfig.ts`. Admins are identified by email address and routed to the admin dashboard.

## Notes
- This is a pure frontend SPA — all backend logic lives in Supabase
- The Supabase Edge Functions (in `/supabase/functions/`) are deployed to and run on Supabase's infrastructure, not on Replit
- Database schema migrations should be run via the Supabase dashboard SQL editor
