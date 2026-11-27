/* Shadows CRM settings. Leave the two Supabase values empty to run in on-device demo mode.
   Both values are PUBLIC by design (security lives in the database rules, see sql/schema.sql). */
window.CRM_CONFIG = {
  supabaseUrl: '',
  supabaseKey: '',
  annualLeaveDays: 21,
  adminEmails: []  /* demo mode only; the live admins come from public.admin_emails in the database */
};
