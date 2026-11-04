import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6">
      <h1 className="font-heading text-3xl">That page is not in Staff Note</h1>
      <Link href="/" className="text-base font-semibold underline underline-offset-4">
        Back to the yard
      </Link>
    </main>
  );
}
