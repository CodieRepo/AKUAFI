"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AdminCard } from "./AdminCard";

interface AdminFormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function AdminFormSection({
  title,
  description,
  children,
  className,
}: AdminFormSectionProps) {
  return (
    <AdminCard className={cn("space-y-6", className)}>
      {(title || description) && (
        <div className="border-b border-gray-200 dark:border-white/10 pb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </AdminCard>
  );
}
