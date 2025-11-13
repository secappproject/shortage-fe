"use client";

import * as React from "react";
import { Sidebar } from "./sidebar"; 
import { Header } from "./header";

export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      <Sidebar isCollapsed={isCollapsed} />
      <div className="relative flex flex-col h-screen overflow-y-auto">
        <div className="hidden md:block">
          <Header 
            toggleSidebar={toggleSidebar} 
            isSidebarCollapsed={isCollapsed} 
          />
        </div>
        
        <div className="p-4 lg:p-6">
            {children}
        </div>
      </div>
    </div>
  );
}