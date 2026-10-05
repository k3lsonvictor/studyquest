export const PRODUCT_NAME = "StudyQuest";
export const demoMode =
  process.env.NODE_ENV === "development" && process.env.STUDYQUEST_DEMO === "1";
export const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
