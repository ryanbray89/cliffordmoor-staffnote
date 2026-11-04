"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { lockOffice } from "@/lib/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OfficeNav({ newCount }: { newCount: number }) {
  const pathname = usePathname();
  const inbox = pathname === "/admin";
  const jobs = pathname.startsWith("/admin/jobs");
  const shopping = pathname.startsWith("/admin/shopping");
  const team = pathname.startsWith("/admin/team");

  return (
    <nav className="flex flex-wrap items-center gap-2">
      <Link
        href="/admin"
        className={buttonVariants({
          variant: inbox ? "default" : "outline",
          className: "h-11 rounded-full px-4",
        })}
        aria-current={inbox ? "page" : undefined}
      >
        Inbox
        <span
          className={cn(
            "ml-2 inline-flex min-w-6 items-center justify-center rounded-full px-1.5 text-xs",
            inbox ? "bg-primary-foreground/20" : "bg-primary text-primary-foreground",
          )}
        >
          {newCount}
        </span>
      </Link>
      <Link
        href="/admin/jobs"
        className={buttonVariants({
          variant: jobs ? "default" : "outline",
          className: "h-11 rounded-full px-4",
        })}
        aria-current={jobs ? "page" : undefined}
      >
        Jobs
      </Link>
      <Link
        href="/admin/shopping"
        className={buttonVariants({
          variant: shopping ? "default" : "outline",
          className: "h-11 rounded-full px-4",
        })}
        aria-current={shopping ? "page" : undefined}
      >
        Shopping
      </Link>
      <Link
        href="/admin/team"
        className={buttonVariants({
          variant: team ? "default" : "outline",
          className: "h-11 rounded-full px-4",
        })}
        aria-current={team ? "page" : undefined}
      >
        Team
      </Link>
      <a
        href="/api/admin/export"
        className={buttonVariants({ variant: "outline", className: "h-11 rounded-full px-4" })}
      >
        Download CSV
      </a>
      <form action={lockOffice}>
        <button
          type="submit"
          className={buttonVariants({ variant: "ghost", className: "h-11 rounded-full px-4" })}
        >
          Lock
        </button>
      </form>
    </nav>
  );
}
