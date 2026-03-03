"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Map,
  Users,
  Activity,
  ClipboardList,
  RefreshCw,
  ChevronRight,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const navItems = [
  {
    label: "Command Center",
    href: "/command-center",
    icon: Map,
  },
  {
    label: "Voter Database",
    href: "/voter-database",
    icon: Users,
  },
  {
    label: "Sentiment Engine",
    href: "/sentiment",
    icon: Activity,
  },
  {
    label: "Task Dispatch",
    href: "/dispatch",
    icon: ClipboardList,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-4 py-5">
        <Link href="/command-center" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Map className="size-4 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Booth Command
            </span>
            <span className="text-[11px] text-sidebar-foreground/50">
              AI Management System
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "h-9 transition-colors",
                        isActive &&
                          "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                        {isActive && (
                          <ChevronRight className="ml-auto size-3 opacity-50" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-3">
        <SidebarSeparator className="mx-0 mb-2" />
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="relative flex size-2.5 items-center justify-center">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-sentiment-positive opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-sentiment-positive" />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
            <RefreshCw className="size-3" />
            <span>DB Synced</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
