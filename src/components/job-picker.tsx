"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JOB_GROUPS, JOB_TASKS, type JobTask } from "@/lib/catalog";
import { orderedJobGroup, type StaffJobChip } from "@/lib/job-schedule";
import { cn } from "@/lib/utils";

const fieldClass = "h-14 rounded-2xl bg-card px-4 text-lg md:text-lg";

function JobChip({
  task,
  pressed,
  due,
  detail,
  onClick,
}: {
  task: string;
  pressed: boolean;
  due: boolean;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={`${task}. ${detail}`}
      onClick={onClick}
      className={cn(
        "flex min-h-12 w-full flex-col items-start rounded-2xl px-4 py-2 text-left",
        pressed && "bg-primary text-primary-foreground",
        !pressed && due && "bg-destructive/10 text-foreground ring-1 ring-destructive",
        !pressed && !due && "bg-card text-foreground ring-1 ring-border",
      )}
    >
      <span className="text-base font-semibold">{task}</span>
      <span
        className={cn(
          "text-sm font-medium",
          pressed ? "text-primary-foreground/80" : due ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {detail}
      </span>
    </button>
  );
}

export function JobPicker({ status }: { status: Record<JobTask, StaffJobChip> }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [other, setOther] = useState("");

  function toggle(task: string) {
    setSelected((current) =>
      current.includes(task) ? current.filter((item) => item !== task) : [...current, task],
    );
  }

  const chosen = JOB_TASKS.filter((task) => selected.includes(task));
  const custom = other.trim();
  const extra = custom && !chosen.some((task) => task === custom) ? custom : "";
  const count = chosen.length + (extra ? 1 : 0);

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-base font-medium">What needs doing?</legend>
      <p className="text-sm text-muted-foreground">Due jobs are marked. Pick every one that applies.</p>
      <div className="flex flex-col gap-4">
        {JOB_GROUPS.map((group, index) => (
          <div key={group[0]} className={index > 0 ? "border-t border-border pt-4" : undefined}>
            <div className="flex flex-col gap-2">
              {orderedJobGroup(group, status).map((task) => (
                <JobChip
                  key={task}
                  task={task}
                  pressed={selected.includes(task)}
                  due={status[task]?.due ?? true}
                  detail={status[task]?.detail ?? "Due"}
                  onClick={() => toggle(task)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {chosen.map((task) => (
        <input key={task} type="hidden" name="jobTask" value={task} />
      ))}
      <div className="flex flex-col gap-2">
        <Label htmlFor="jobOther" className="text-base">
          Other
        </Label>
        <Input
          id="jobOther"
          name="jobOther"
          value={other}
          onChange={(event) => setOther(event.target.value)}
          placeholder="A job that is not in the list"
          maxLength={80}
          autoComplete="off"
          className={fieldClass}
        />
        <p className="text-sm text-muted-foreground">Optional. Added with the jobs you picked.</p>
      </div>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {count === 0 ? "Nothing picked yet." : `${count} picked${extra ? `, including ${extra}` : ""}.`}
      </p>
    </fieldset>
  );
}
