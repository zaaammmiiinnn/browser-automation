import { defineConfig } from "@trigger.dev/sdk"
import { esbuildPlugin } from "@trigger.dev/build/extensions"
import sentryEsbuildPlugin from "@sentry/esbuild-plugin"
export default defineConfig({
  project: "proj_aibcrxthiixsgpsbivcm",
  runtime: "node",
  logLevel: "log",
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["features/workflows/tasks"],
  build: {
    extensions: [
      esbuildPlugin(
        sentryEsbuildPlugin({
          org: "enra-r3",
          project: "browser-automation",
          authToken: process.env.SENTRY_AUTH_TOKEN,
        }),
        { placement: "last", target: "deploy" }
      ),
    ],
  },
})
