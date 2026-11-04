"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { createEntry } from "@/lib/actions";
import { AREAS, DURATIONS, JOB_SUGGESTIONS, MAX_PHOTO_BYTES, NOTE_CATEGORIES, SERVICES } from "@/lib/catalog";
import { compressPhoto } from "@/lib/compress-photo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const fieldClass = "h-14 rounded-2xl bg-card px-4 text-lg md:text-lg";
const areaClass = "min-h-32 rounded-2xl bg-card px-4 py-3 text-lg md:text-lg";

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-12 items-center rounded-full px-4 text-base font-semibold",
        pressed ? "bg-primary text-primary-foreground" : "bg-card text-foreground ring-1 ring-border",
      )}
    >
      {children}
    </button>
  );
}

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
}: {
  kind: "job" | "dog" | "note";
  today: string;
  minDate: string;
  recentDogs: string[];
}) {
  const [state, action, pending] = useActionState(createEntry, {});
  const [title, setTitle] = useState("");
  const [service, setService] = useState("");
  const [customService, setCustomService] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [area, setArea] = useState("");
  const [jobState, setJobState] = useState<"done" | "needs_doing">("done");
  const [quantity, setQuantity] = useState(1);
  const [duration, setDuration] = useState("");
  const [dogName, setDogName] = useState("");

  const entryType = kind === "job" ? "extra_job" : kind === "dog" ? "extra_dog_work" : "note";
  const submittedTitle =
    kind === "job" ? title : kind === "dog" ? (service === "Other" ? customService : service) : category === "Other" ? customCategory : category;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="type" value={entryType} />
      <input type="hidden" name="title" value={submittedTitle} />

      {kind === "job" ? (
        <Field label="What is the job?">
          <div className="flex flex-wrap gap-2">
            {JOB_SUGGESTIONS.map((item) => (
              <Chip key={item} pressed={title === item} onClick={() => setTitle(item)}>
                {item}
              </Chip>
            ))}
          </div>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Or type it"
            maxLength={80}
            autoComplete="off"
            className={fieldClass}
          />
        </Field>
      ) : null}

      {kind === "job" ? (
        <Field label="Where on the yard?" hint="Optional.">
          <input type="hidden" name="area" value={area} />
          <div className="flex flex-wrap gap-2">
            {AREAS.map((item) => (
              <Chip key={item} pressed={area === item} onClick={() => setArea(area === item ? "" : item)}>
                {item}
              </Chip>
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
                <Chip key={dog} pressed={dogName === dog} onClick={() => setDogName(dog)}>
                  {dog}
                </Chip>
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
        <Field label="What was done?">
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((item) => (
              <Chip key={item} pressed={service === item} onClick={() => setService(item)}>
                {item}
              </Chip>
            ))}
          </div>
          {service === "Other" ? (
            <Input
              value={customService}
              onChange={(event) => setCustomService(event.target.value)}
              placeholder="What was it?"
              maxLength={80}
              autoComplete="off"
              className={fieldClass}
            />
          ) : null}
        </Field>
      ) : null}

      {kind === "dog" ? (
        <Field label="How many?">
          <input type="hidden" name="quantity" value={quantity} />
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="size-14 rounded-2xl text-2xl"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              aria-label="Fewer"
            >
              −
            </Button>
            <span className="w-12 text-center text-2xl font-semibold tabular-nums">{quantity}</span>
            <Button
              type="button"
              variant="outline"
              className="size-14 rounded-2xl text-2xl"
              onClick={() => setQuantity((value) => Math.min(20, value + 1))}
              aria-label="More"
            >
              +
            </Button>
          </div>
        </Field>
      ) : null}

      {kind === "dog" ? (
        <Field label="How long?" hint="Optional.">
          <input type="hidden" name="durationMins" value={duration} />
          <div className="flex flex-wrap gap-2">
            <Chip pressed={duration === ""} onClick={() => setDuration("")}>
              No set time
            </Chip>
            {DURATIONS.map((minutes) => (
              <Chip
                key={minutes}
                pressed={duration === String(minutes)}
                onClick={() => setDuration(String(minutes))}
              >
                {minutes} min
              </Chip>
            ))}
          </div>
        </Field>
      ) : null}

      {kind === "note" ? (
        <Field label="What sort of note?">
          <div className="flex flex-wrap gap-2">
            {NOTE_CATEGORIES.map((item) => (
              <Chip key={item} pressed={category === item} onClick={() => setCategory(item)}>
                {item}
              </Chip>
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

      <Field label="Date">
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
