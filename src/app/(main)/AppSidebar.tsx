"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { MdHome } from "react-icons/md";
import { HiPresentationChartBar } from "react-icons/hi2";
import { RiPagesFill } from "react-icons/ri";
import { IoChatboxEllipses } from "react-icons/io5";
import { IoMdSettings } from "react-icons/io";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaGift } from "react-icons/fa6";
import type { FS_UserRole } from "@eventory/shared-types/firestore";
import type { SupportRoutePath } from "@/hooks/use-nav";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  icon: React.ReactNode;
  title: string;
  pathname: SupportRoutePath;
  role: FS_UserRole | null;
}

const navItems: NavItem[] = [
  {
    icon: <MdHome size={20} />,
    pathname: "/",
    title: "home",
    role: null,
  },
  {
    icon: <RiPagesFill size={20} />,
    pathname: "/events",
    title: "events",
    role: null,
  },
  {
    icon: <IoChatboxEllipses size={20} />,
    pathname: "/chats",
    title: "chats",
    role: "participant",
  },
  {
    icon: <HiPresentationChartBar size={20} />,
    pathname: "/stats",
    title: "stats",
    role: "influencer",
  },
  {
    icon: <FaGift size={20} />,
    pathname: "/rewards",
    title: "rewards",
    role: "influencer",
  },
  {
    icon: <IoMdSettings size={20} />,
    pathname: "/settings",
    title: "settings",
    role: "participant",
  },
];

function Profile() {
  const { user } = useAuth();

  if (!user) return <></>;

  return (
    <Card className="px-4">
        <section className="flex gap-4">
          <Avatar>
            <AvatarImage src={user.photoURL ?? ""}/>
            <AvatarFallback>{user.displayName?.slice(0, 2)}</AvatarFallback>
          </Avatar>

          <div className="">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.displayName}
              </p>
              <p className="text-xs text-muted-foreground break-all">
                {user.email}
              </p>
            </div>
          </div>
        </section>
    </Card>
  );
}
export default function AppSidebar() {
  const { user, logout, login } = useAuth();
  const pathname = usePathname();

  const filteredItems = navItems.filter(
    (item) =>
      item.role === null ||
      (user && (item.role === "participant" || user.role === item.role))
  );

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>

          <Button onClick={() => (user ? logout() : login(pathname))}>
            {user ? "Logout" : "Login"}
          </Button>

          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.pathname}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.pathname}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted ${
                        pathname === item.pathname
                          ? "bg-muted font-semibold"
                          : ""
                      }`}
                    >
                      {item.icon}
                      <span className="capitalize">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Profile />
      </SidebarFooter>
    </Sidebar>
  );
}
