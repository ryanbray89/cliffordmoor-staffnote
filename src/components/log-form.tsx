"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { createEntry } from "@/lib/actions";
import { AREAS, MAX_PHOTO_BYTES, NOTE_CATEGORIES, WALK_TITLE } from "@/lib/catalog";
import { compressPhoto } from "@/lib/compress-photo";
import { ChoiceChip } from "@/components/choice-chip";
import { JobPicker } from "@/components/job-picker";
import type { JobTask } from "@/lib/catalog";
import type { StaffJobChip } from "@/lib/job-schedule";
import { WalkCalendar } from "@/components/walk-calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const fieldClass = "h-14 rounded-2xl bg-card px-4 text-lg md:text-lg";
const areaClass = "min-h-32 rounded-2xl bg-card px-4 py-3 text-lg md:text-lg";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-base">{label}</Label>
      {children}
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function PhotoField() {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function replacePreview(next: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next;
    setPreview(next);
  }

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  async function onChoose(file: File | undefined) {
    setError(null);
    if (!file) return;
    try {
      const prepared = await compressPhoto(file);
      if (inputRef.current) {
        const transfer = new DataTransfer();
        transfer.items.add(prepared);
        inputRef.current.files = transfer.files;
      }
      replacePreview(URL.createObjectURL(prepared));
    } catch (caught) {
      const allowed = file.size <= MAX_PHOTO_BYTES && /image\/(jpeg|png|webp)/.test(file.type);
      if (allowed) {
        replacePreview(URL.createObjectURL(file));
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      replacePreview(null);
      setError(caught instanceof Error ? caught.message : "Could not use that photo.");
    }
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    replacePreview(null);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="photo" className="text-base">
        Photo, if it helps
      </Label>
      <input
        ref={inputRef}
        id="photo"
        name="photo"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => void onChoose(event.target.files?.[0])}
      />
      {preview ? (
        <div className="flex flex-col gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Photo ready to send" className="max-h-64 w-full rounded-2xl object-cover" />
          <button type="button" onClick={clear} className="h-12 text-base font-semibold text-muted-foreground underline">
            Remove photo
          </button>
        </div>
      ) : (
        <label
          htmlFor="photo"
          className="flex h-14 cursor-pointer items-center justify-center rounded-2xl bg-card text-base font-semibold ring-1 ring-border"
        >
          Add a photo
        </label>
      )}
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Optional. A picture of the job, the dog, or the problem.</p>
      )}
    </div>
  );
}

function UrgentToggle() {
  const [urgent, setUrgent] = useState(false);
  return (
    <label
      className={cn(
        "flex min-h-14 cursor-pointer items-center justify-center rounded-2xl px-4 text-center text-base font-semibold ring-1",
        urgent ? "bg-destructive text-white ring-destructive" : "bg-card text-foreground ring-border",
      )}
    >
      <input
        type="checkbox"
        name="urgent"
        value="1"
        checked={urgent}
        onChange={(event) => setUrgent(event.target.checked)}
        className="sr-only"
      />
      {urgent ? "Urgent — Ryan will see this first" : "Mark as urgent"}
    </label>
  );
}

export function LogForm({
  kind,
  today,
  minDate,
  recentDogs,
  jobStatus,
}: {
  kind: "job" | "dog" | "note";
  today: string;
  minDate: string;
  recentDogs: string[];
  jobStatus?: Record<JobTask, StaffJobChip>;
}) {
  const [state, action, pending] = useActionState(createEntry, {});
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [area, setArea] = useState("");
  const [jobState, setJobState] = useState<"done" | "needs_doing">("done");
  const [dogName, setDogName] = useState("");

  const entryType = kind === "job" ? "extra_job" : kind === "dog" ? "extra_dog_work" : "note";
  const submittedTitle = kind === "dog" ? WALK_TITLE : category === "Other" ? customCategory : category;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="type" value={entryType} />
      <input type="hidden" name="title" value={kind === "job" ? "" : submittedTitle} />

      {kind === "job" && jobStatus ? <JobPicker status={jobStatus} /> : null}

      {kind === "job" ? (
        <Field label="Where on the yard?" hint="Optional.">
          <input type="hidden" name="area" value={area} />
          <div className="flex flex-wrap gap-2">
            {AREAS.map((item) => (
              <ChoiceChip key={item} pressed={area === item} onClick={() => setArea(area === item ? "" : item)}>
                {item}
              </ChoiceChip>
            ))}
          </div>
        </Field>
      ) : null}

      {kind === "job" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-base font-medium">Is it done?</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["done", "Done", "Already finished"],
                ["needs_doing", "Needs doing", "Still to do"],
              ] as const
            ).map(([value, label, hint]) => (
              <label
                key={value}
                className={cn(
                  "flex min-h-20 cursor-pointer flex-col justify-center rounded-2xl px-4 ring-1",
                  jobState === value ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-border",
                )}
              >
                <input
                  type="radio"
                  name="jobState"
                  value={value}
                  checked={jobState === value}
                  onChange={() => setJobState(value)}
                  className="sr-only"
                />
                <span className="text-base font-semibold">{label}</span>
                <span className={cn("text-sm", jobState === value ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {hint}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {kind === "dog" ? (
        <Field label="Dog's name">
          {recentDogs.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recentDogs.map((dog) => (
                <ChoiceChip key={dog} pressed={dogName === dog} onClick={() => setDogName(dog)}>
                  {dog}
                </ChoiceChip>
              ))}
            </div>
          ) : null}
          <Input
            name="dogName"
            value={dogName}
            onChange={(event) => setDogName(event.target.value)}
            autoComplete="off"
            autoCapitalize="words"
            maxLength={60}
            placeholder="Name"
            className={fieldClass}
          />
        </Field>
      ) : null}

      {kind === "dog" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner" hint="Optional.">
            <Input name="ownerName" autoComplete="off" autoCapitalize="words" maxLength={80} className={fieldClass} />
          </Field>
          <Field label="Kennel" hint="Optional.">
            <Input name="kennel" autoComplete="off" maxLength={12} className={fieldClass} />
          </Field>
        </div>
      ) : null}

      {kind === "dog" ? (
        <Field label="Which days?" hint="Tap a day to add or remove it. Each walk is 30 minutes.">
          <WalkCalendar today={today} />
        </Field>
      ) : null}

      {kind === "note" ? (
        <Field label="What sort of note?">
          <div className="flex flex-wrap gap-2">
            {NOTE_CATEGORIES.map((item) => (
              <ChoiceChip key={item} pressed={category === item} onClick={() => setCategory(item)}>
                {item}
              </ChoiceChip>
            ))}
          </div>
          {category === "Other" ? (
            <Input
              value={customCategory}
              onChange={(event) => setCustomCategory(event.target.value)}
              placeholder="What is it about?"
              maxLength={80}
              className={fieldClass}
            />
          ) : null}
        </Field>
      ) : null}

      {kind === "note" ? (
        <Field label="Dog, if it is about one" hint="Optional.">
          <Input
            name="dogName"
            autoComplete="off"
            autoCapitalize="words"
            maxLength={60}
            placeholder="Name"
            className={fieldClass}
          />
        </Field>
      ) : null}

      <Field
        label={kind === "note" ? "Message for Ryan" : "Anything else?"}
        hint={kind === "note" ? undefined : "Optional."}
      >
        <Textarea
          name="detail"
          maxLength={1000}
          placeholder={kind === "note" ? "What should Ryan know?" : "Short note"}
          className={areaClass}
        />
      </Field>

      <Field
        label={kind === "dog" ? "Logged on" : "Date"}
        hint={kind === "dog" ? "The day you are writing this down." : undefined}
      >
        <Input type="date" name="happenedOn" defaultValue={today} min={minDate} max={today} required className={fieldClass} />
      </Field>

      <PhotoField />
      <UrgentToggle />

      {state.error ? (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </p>
      ) : null}

      <div style={{ paddingBottom: "calc(0.25rem + env(safe-area-inset-bottom))" }}>
        <Button type="submit" disabled={pending} className="h-14 w-full rounded-2xl text-base font-semibold">
          {pending ? "Saving…" : "Save this log"}
        </Button>
      </div>
    </form>
  );
}
