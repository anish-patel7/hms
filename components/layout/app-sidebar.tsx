"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Plane,
  Calendar,
  BarChart3,
  Cake,
  PartyPopper,
  Image,
  MessageSquare,
  Users,
  Settings,
  LogOut,
} from 'lucide-react'
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
} from '@/components/ui/sidebar'
import { useAuth } from '@/components/auth/auth-provider'
import { getSettings } from '@/lib/storage'
import { useEffect, useState } from 'react'

const mainNavItems = [
  { title: 'Home', href: '/home', icon: Home },
  { title: 'Past Trips', href: '/trips', icon: Plane },
  { title: 'Upcoming', href: '/upcoming', icon: Calendar },
  { title: 'Polls', href: '/polls', icon: BarChart3 },
]

const celebrationNavItems = [
  { title: 'Birthdays', href: '/birthdays', icon: Cake },
  { title: 'Festivals', href: '/celebrations', icon: PartyPopper },
]

const socialNavItems = [
  { title: 'Gallery', href: '/gallery', icon: Image },
  { title: 'Group Wall', href: '/wall', icon: MessageSquare },
  { title: 'Members', href: '/members', icon: Users },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [groupName, setGroupName] = useState('Team Voyage')

  useEffect(() => {
    setGroupName(getSettings().groupName)
  }, [])

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/home" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Plane className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-balance">{groupName}</h1>
            <p className="text-xs text-muted-foreground">Your memory vault</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Celebrations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {celebrationNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Social</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {socialNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              tooltip="Logout"
            >
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
