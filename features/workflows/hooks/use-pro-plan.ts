import { useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
const PRO_PLAN = "pro"
const BILLING_PATH = "/billing"
export type ProPlan = {
  isLoaded: boolean
  isPro: boolean
  goToUpgrade: () => void
}
export function useProPlan(): ProPlan {
  const { has, isLoaded } = useAuth()
  const router = useRouter()
  const goToUpgrade = useCallback(() => {
    router.push(BILLING_PATH)
  }, [router])
  const isPro = has?.({ plan: PRO_PLAN }) ?? false
  return { isLoaded, isPro, goToUpgrade }
}
