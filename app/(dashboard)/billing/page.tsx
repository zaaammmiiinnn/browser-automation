"use client"

import React, { Component, ReactNode } from "react"
import { PricingTable } from "@clerk/nextjs"
import { Check, ExternalLink, ShieldAlert, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
}

class PricingTableBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.warn("PricingTable could not render (billing not enabled):", error.message)
  }

  render() {
    if (this.state.hasError) {
      return <BillingSetupNotice />
    }
    return this.props.children
  }
}

function BillingSetupNotice() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="size-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <h3 className="font-medium text-foreground text-sm">
              Clerk Billing is not yet enabled
            </h3>
            <p className="text-xs text-muted-foreground">
              Turn on Organization Billing in your Clerk Dashboard to activate the live checkout drawer.
            </p>
          </div>
        </div>
        <Button asChild size="sm" variant="default" className="shrink-0">
          <a
            href="https://dashboard.clerk.com/last-active?path=billing/settings"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5"
          >
            Enable in Clerk Dashboard
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Free</CardTitle>
              <Badge variant="secondary">Current Plan</Badge>
            </div>
            <CardDescription>Essential automation building blocks</CardDescription>
            <div className="pt-2 text-3xl font-bold">$0 <span className="text-sm font-normal text-muted-foreground">/ month</span></div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Included features:</div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="size-4 text-emerald-500 shrink-0" />
              <span>Standard workflow runner</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="size-4 text-emerald-500 shrink-0" />
              <span>Core nodes: Start, Open URL, Act, Extract</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="size-4 text-emerald-500 shrink-0" />
              <span>Observe candidate actions</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="size-4 text-emerald-500 shrink-0" />
              <span>Resend transactional email node</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              Active Plan
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col justify-between border-primary/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-bl-lg flex items-center gap-1">
            <Sparkles className="size-3" />
            Recommended
          </div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Pro</CardTitle>
            </div>
            <CardDescription>Advanced autonomous AI &amp; session recordings</CardDescription>
            <div className="pt-2 text-3xl font-bold">$20 <span className="text-sm font-normal text-muted-foreground">/ month</span></div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Everything in Free, plus:</div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Check className="size-4 text-primary shrink-0" />
              <span>Autonomous AI Agent node (Computer Use)</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Check className="size-4 text-primary shrink-0" />
              <span>Browserbase Session Replays (video player)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="size-4 text-emerald-500 shrink-0" />
              <span>Real-time collaborative canvas</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="size-4 text-emerald-500 shrink-0" />
              <span>Priority execution queue</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <a
                href="https://dashboard.clerk.com/last-active?path=billing/settings"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5"
              >
                Enable Billing to Subscribe
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <div className="h-svh overflow-y-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-muted-foreground text-sm">
            Choose a plan for your organization. Upgrades and checkout happen
            right here.
          </p>
        </div>
        <PricingTableBoundary>
          <PricingTable
            for="organization"
            newSubscriptionRedirectUrl="/billing"
          />
        </PricingTableBoundary>
      </div>
    </div>
  )
}
