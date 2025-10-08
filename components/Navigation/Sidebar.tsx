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
  const pathname = usePathname()
  const { setOpen } = useSidebar()
  return (
    <Sidebar className="border-border/40 bg-sidebar/90 text-sidebar-foreground shadow-lg backdrop-blur transition-colors duration-300 supports-[backdrop-filter]:bg-sidebar/75 dark:border-sidebar-border/60 dark:bg-sidebar/95">
      <SidebarHeader className="border-b border-border/40 pb-4 dark:border-sidebar-border/60">
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white/70 p-3 shadow-sm backdrop-blur-sm transition-colors duration-300 dark:border-sidebar-border/60 dark:bg-secondary/20">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary shadow-sm dark:bg-primary/20 dark:text-primary-foreground">
            <PlugZap className="size-4" />
          </div>
          <div className="text-sm leading-tight">
            <p className="font-semibold text-sidebar-foreground">Elisa</p>
            <p className="text-xs text-muted-foreground">Electric Vehicle Charging Control</p>
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
                  <SidebarMenuButton
                    asChild
                    onClick={() => setOpen(false)}
                    isActive={pathname === item.href}
                    className="border border-transparent bg-white/40 text-sidebar-foreground transition-colors duration-200 hover:border-accent hover:bg-accent/30 hover:text-accent-foreground dark:border-transparent dark:bg-transparent dark:text-sidebar-foreground data-[active=true]:border-accent data-[active=true]:bg-accent/35 data-[active=true]:text-accent-foreground"
                  >
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className="flex w-full items-center gap-2"
                    >
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
                  <SidebarMenuButton
                    asChild
                    className="border border-transparent bg-white/40 text-sidebar-foreground transition-colors duration-200 hover:border-accent hover:bg-accent/30 hover:text-accent-foreground dark:border-transparent dark:bg-transparent"
                  >
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
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 pt-4 dark:border-sidebar-border/60">
        <div className="rounded-xl border border-border/60 bg-white/70 p-3 text-xs leading-relaxed shadow-inner transition-colors duration-300 dark:border-sidebar-border/60 dark:bg-secondary/20">
          <p className="font-semibold uppercase tracking-[0.25em] text-sidebar-foreground/80">Session health</p>
          <p className="mt-1 text-muted-foreground">All systems nominal</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export default SidebarLayout