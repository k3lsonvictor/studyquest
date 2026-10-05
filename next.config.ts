import type { NextConfig } from "next";
const config: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  distDir:
    process.env.STUDYQUEST_E2E === "1"
      ? ".next-e2e"
      : process.env.STUDYQUEST_DEMO === "1"
        ? ".next-demo"
        : ".next",
};
export default config;
