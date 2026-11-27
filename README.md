# Shadows CRM
Mobile-first CRM for the Shadows team: tickets, leaves, resignations, clients, dashboard. Navigation is the owl-eye lens dial at the bottom: drag left or right, release to open.

Runs in demo mode (data in the browser) until `js/config.js` has a Supabase URL and anon key. For the shared backend, run `sql/schema.sql` in the Supabase SQL editor, keep "Confirm email" ON, add each person to `invited_emails` (or use Authentication > Invite user), and fill `js/config.js`. The first account to sign up becomes admin.


## Access model (live mode)
- Invite-only: signup works only for emails in `invited_emails` or `admin_emails`. Anyone else is rejected by the database.
- Keep Supabase "Confirm email" ON. Roles are set in the database: admin only for the two `admin_emails` and only after the email is verified. There is no role-change UI.
- Every policy requires a verified, invited member (`is_member()`). Run `sql/rls_checks.sql` before any real data goes in.
