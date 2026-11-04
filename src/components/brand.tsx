import Link from "next/link";

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="#1e4d38" />
      <ellipse cx="24" cy="29" rx="7.2" ry="5.6" fill="#f4efe6" />
      <ellipse cx="13.2" cy="20.5" rx="3.1" ry="4" fill="#f4efe6" />
      <ellipse cx="19.6" cy="14.6" rx="3.1" ry="4.2" fill="#f4efe6" />
      <ellipse cx="28.4" cy="14.6" rx="3.1" ry="4.2" fill="#f4efe6" />
      <ellipse cx="34.8" cy="20.5" rx="3.1" ry="4" fill="#f4efe6" />
    </svg>
  );
}

export function BrandLockup({ title, href = "/" }: { title: string; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl focus-visible:ring-3 focus-visible:ring-ring">
      <Mark className="size-12 shrink-0" />
      <span>
        <span className="block font-heading text-[1.35rem] leading-none tracking-tight text-foreground">
          Clifford Moor
        </span>
        <span className="mt-1 block text-sm font-medium text-muted-foreground">{title}</span>
      </span>
    </Link>
  );
}
