// Add your admin email addresses here
export const ADMIN_EMAILS = [
  "admin@syedomlabs.com",
  // Add more admin emails as needed
];

export const isAdminEmail = (email: string | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
