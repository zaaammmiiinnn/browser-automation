import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"
const nextConfig: NextConfig = {
  devIndicators: false,
}
export default withSentryConfig(nextConfig, {
  org: "enra-r3",
  project: "browser-automation",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
})
