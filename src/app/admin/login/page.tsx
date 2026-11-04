import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandLockup } from "@/components/brand";
import { OfficeLock } from "@/components/office-lock";
import { Shell } from "@/components/shell";
import { adminConfigured, isAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Office lock" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  const configured = adminConfigured();

  return (
    <Shell>
      <BrandLockup title="Office book" href="/admin/login" />
      <h1 className="mt-6 font-heading text-3xl tracking-tight">Office lock</h1>
      <p className="mt-2 mb-6 text-base text-muted-foreground">
        For Ryan. Staff tap their name on the yard screen and do not need this.
      </p>
      {configured ? (
        <OfficeLock />
      ) : (
        <p role="alert" className="rounded-2xl bg-card p-5 ring-1 ring-border">
          The office PIN is not set. Add ADMIN_PIN to the environment and restart.
        </p>
      )}
      <p className="mt-6">
        <Link href="/" className="text-sm font-semibold underline underline-offset-4">
          Back to the yard
        </Link>
      </p>
    </Shell>
  );
}
