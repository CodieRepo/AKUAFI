"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLoadingStateProps {
  text?: string;
  className?: string;
}

export function AdminLoadingState({
  text = "Loading...",
  className,
}: AdminLoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4",
        className,
      )}
    >
      <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
      <p className="text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
}
