"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignCircleIcon, Mail01Icon } from "@hugeicons/core-free-icons"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Akademik: true,
    Organisasi: true,
    "Habit Tracker": true,
    "Goal & Life Planning": true,
  })

  const { setOpenMobile, isMobile } = useSidebar()

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  // Auto-expand menu containing the active page
  useEffect(() => {
    const activeItem = items.find(
      (item) =>
        pathname === item.url ||
        item.items?.some((sub) => pathname === sub.url)
    )
    if (activeItem) {
      setOpenMenus((prev) => ({
        ...prev,
        [activeItem.title]: true,
      }))
    }
  }, [pathname, items])

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* Quick Create & Inbox */}
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              data-tour="nav-quick-create"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            >
              <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Main Navigation */}
        <SidebarMenu>
          {items.map((item) => {
            const hasSubmenu = item.items && item.items.length > 0
            const isOpen = openMenus[item.title]

            return (
              <SidebarMenuItem key={item.title} className="flex flex-col gap-1 w-full">
                {hasSubmenu ? (
                  <SidebarMenuButton
                    onClick={() => toggleMenu(item.title)}
                    tooltip={item.title}
                    className="w-full flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.title}</span>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`size-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link
                      href={item.url}
                      onClick={handleLinkClick}
                      data-tour={`nav-${slug(item.title)}`}
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}

                {hasSubmenu && isOpen && (
                  <div className="flex flex-col gap-0.5 pl-6 border-l-2 border-border/20 ml-3.5 mt-0.5">
                    {item.items?.map((subItem) => {
                      const isActive = pathname === subItem.url
                      return (
                        <Link
                          key={subItem.title}
                          href={subItem.url}
                          onClick={handleLinkClick}
                          data-tour={`nav-${slug(item.title)}-${slug(subItem.title)}`}
                          className={`text-xs font-semibold py-1 px-2 rounded-[var(--radius)] transition-colors uppercase tracking-wider block ${
                            isActive
                              ? "text-primary bg-primary/10 font-bold border-l-2 border-primary -ml-[2px] rounded-l-none"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          {subItem.title}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

