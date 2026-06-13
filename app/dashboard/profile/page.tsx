"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ProfileRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/settings")
  }, [router])

  return (
    <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
      Mengalihkan ke pengaturan...
    </div>
  )
}
