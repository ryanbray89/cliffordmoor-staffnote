"use client";

import { useState, useTransition } from "react";

import { addReply } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReplyBox({ entryId }: { entryId: string }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const body = text;
        startTransition(async () => {
          const result = await addReply(entryId, body);
          if (result.error) {
            setError(result.error);
            return;
          }
          setText("");
          setError("");
        });
      }}
    >
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={1000}
        placeholder="Reply to the yard"
        aria-label="Reply to the yard"
        className="min-h-20 rounded-2xl bg-card px-3 py-2 text-base md:text-base"
      />
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || text.trim().length === 0} className="h-12 rounded-2xl text-base">
        {pending ? "Sending…" : "Send reply"}
      </Button>
    </form>
  );
}
