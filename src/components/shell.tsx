import Link from "next/link";

import { cn } from "@/lib/utils";

export function Shell({
  children,
  wide = false,
  home,
}: {
  children: React.ReactNode;
  wide?: boolean;
  home?: "yard" | "office";
}) {
  return (
    <div className={cn("mx-auto flex min-h-dvh w-full flex-col px-4 pt-5", wide ? "max-w-5xl" : "max-w-lg")}>
      <div className="flex-1">{children}</div>
      {home === "yard" ? (
        <footer className="mt-10 pb-8 text-center text-sm text-muted-foreground">
          <p className="font-heading text-base text-foreground">Clifford Moor Farm Pet Hotel</p>
          <p className="mt-1">Rhodes Lane, Boston Spa, LS23 6LQ</p>
          <p className="mt-3">
            <Link href="/admin" className="underline underline-offset-4">
              Office
            </Link>
          </p>
        </footer>
      ) : null}
      {home === "office" ? (
        <footer className="mt-10 pb-8 text-center text-sm text-muted-foreground">
          <Link href="/" className="underline underline-offset-4">
            Back to the yard
          </Link>
        </footer>
      ) : null}
    </div>
  );
}
