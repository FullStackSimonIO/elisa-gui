"use client"

import Link from "next/link"
import {
  BatteryCharging,
  PlugZap,
  Settings,
  LifeBuoy,
  BarChart3,
  ScrollText
} from "lucide-react"

import { FaCar } from "react-icons/fa"

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
  useSidebar,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

const navigationItems = [
  {
    label: "Vehicle",
    icon: FaCar,
    href: "/",
    description: "Vehicle status and control",
    active: true,
  },
  {
    label: "Certificate Management",
    icon: ScrollText,
    href: "/certificates",
    description: "Manage your certificates",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    href: "/analytics",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

const supportItems = [
  {
    label: "Diagnostics",
    icon: BatteryCharging,
    href: "#",
  },
  {
    label: "Support",
    icon: LifeBuoy,
    href: "#",
  },
]

const SidebarLayout = () => {
  const  pathname = usePathname()
  const { setOpen } = useSidebar()
  return (
    <Sidebar className="border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <SidebarHeader className="border-b border-border/50">
        <div className="flex items-center gap-2 rounded-xl bg-muted/30 p-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-brand/15 text-brand">
            <PlugZap className="size-4 text-background dark:text-foreground" />
          </div>
          <div className="text-sm leading-tight">
            <p className="font-semibold text-background dark:text-foreground">Elisa Control</p>
            <p className="text-xs font-semibold text-muted-background/70 dark:text-foreground/70">Charging orchestration</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild  onClick={() => setOpen(false)} isActive={pathname === item.href}>
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}className="flex items-center gap-2">
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50">
        <div className="rounded-lg border border-border/50 bg-muted/10 p-3 text-xs ">
          <p className="font-semibold uppercase tracking-[0.25em] text-background dark:text-foreground">Session health</p>
          <p className="mt-1 text-background/70 dark:text-foreground/70">All systems nominal</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export default SidebarLayout