"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6">
      <h1 className="font-heading text-3xl">The book did not open</h1>
      <p className="text-base text-muted-foreground">
        Something went wrong loading Staff Note. Check the connection and try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="h-14 rounded-2xl bg-primary text-base font-semibold text-primary-foreground"
      >
        Try again
      </button>
    </main>
  );
}
