"use client"
import { useEffect } from "react"
import { ExternalLink, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
export default function BillingError({
  error,
  reset,
}: {
  error: Error & {
    digest?: string
  }
  reset: () => void
}) {
  useEffect(() => {
    console.warn("Billing route error:", error)
  }, [error])
  return (
    <div className="h-svh overflow-y-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organization&apos;s subscription and plan.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-6 shrink-0 text-amber-500" />
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-foreground">
                Organization Billing Setup Required
              </h3>
              <p className="text-sm text-muted-foreground">
                Clerk Billing is currently disabled for this project instance.
                To view the live Pricing Table and manage subscriptions, please
                enable billing in your Clerk dashboard.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild variant="default" size="sm">
              <a
                href="https://dashboard.clerk.com/last-active?path=billing/settings"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5"
              >
                Open Clerk Billing Settings
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => reset()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
