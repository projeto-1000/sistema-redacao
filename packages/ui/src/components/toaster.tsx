"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      className="toaster group"
      closeButton
      toastOptions={{
        classNames: {
          toast: "group border-slate-200 shadow-lg rounded-xl",
          title: "font-bold",
          description: "text-slate-800",
          success: "bg-emerald-50!",
          error: "bg-red-50!",
          icon: "group-data-[type=success]:text-success group-data-[type=error]:text-red-500",
        },
      }}
    />
  );
}