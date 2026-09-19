// The single fixed account the passphrase screen signs into.
// Set VITE_APP_EMAIL to the email you created that Supabase user with.
export const APP_EMAIL = import.meta.env.VITE_APP_EMAIL as string;

// Seeded once on first login if you have no categories yet. Edit freely in Settings.
export const DEFAULT_CATEGORIES = [
  "General",
  "Science/Technology/Built",
  "Philosophy/Meditation/Psychedelics",
];
