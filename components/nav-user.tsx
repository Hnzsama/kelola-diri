"use client"

import { signOut, useSession } from "next-auth/react"


import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreVerticalCircle01Icon, UserCircle02Icon, CreditCardIcon, Notification03Icon, Logout01Icon } from "@hugeicons/core-free-icons"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { data: session } = useSession()
  const { isMobile } = useSidebar()

  const activeUser = {
    name: session?.user?.name || user.name,
    email: session?.user?.email || user.email,
    avatar: session?.user?.image || user.avatar,
  }

  // Get initials for fallback
  const initials = activeUser.name
    ? activeUser.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "KD"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={activeUser.avatar} alt={activeUser.name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeUser.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {activeUser.email}
                </span>
              </div>
              <HugeiconsIcon icon={MoreVerticalCircle01Icon} strokeWidth={2} className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={activeUser.avatar} alt={activeUser.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{activeUser.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeUser.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <a href="/dashboard/settings" className="flex items-center gap-2 w-full cursor-pointer">
                  <HugeiconsIcon icon={UserCircle02Icon} strokeWidth={2} />
                  <span>Profile</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
