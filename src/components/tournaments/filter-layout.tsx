"use client";

import { ReactNode } from "react";

interface FilterLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
}

export function FilterLayout({ sidebar, content }: FilterLayoutProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 w-full">
      {/* Sidebar - hidden on mobile, fixed on desktop */}
      <aside className="hidden lg:block lg:col-span-1">
        <div className="sticky top-4 space-y-6">
          {sidebar}
        </div>
      </aside>

      {/* Main content - full width on mobile, 3 cols on desktop */}
      <div className="col-span-1 lg:col-span-3 w-full">
        {content}
      </div>
    </div>
  );
}
