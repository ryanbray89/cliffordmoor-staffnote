"use client";

import { useState } from "react";

import { ChoiceChip } from "@/components/choice-chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JOB_GROUPS, JOB_TASKS } from "@/lib/catalog";

const fieldClass = "h-14 rounded-2xl bg-card px-4 text-lg md:text-lg";

export function JobPicker() {
  const [selected, setSelected] = useState<string[]>([]);
  const [other, setOther] = useState("");

  function toggle(task: string) {
    setSelected((current) =>
      current.includes(task) ? current.filter((item) => item !== task) : [...current, task],
    );
  }

  const chosen = JOB_TASKS.filter((task) => selected.includes(task));
  const custom = other.trim();
  const extra = custom && !chosen.includes(custom) ? custom : "";
  const count = chosen.length + (extra ? 1 : 0);

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-base font-medium">What needs doing?</legend>
      <p className="text-sm text-muted-foreground">Pick every job that applies.</p>
      <div className="flex flex-col gap-4">
        {JOB_GROUPS.map((group, index) => (
          <div key={group[0]} className={index > 0 ? "border-t border-border pt-4" : undefined}>
            <div className="flex flex-wrap gap-2">
              {group.map((task) => (
                <ChoiceChip key={task} pressed={selected.includes(task)} onClick={() => toggle(task)}>
                  {task}
                </ChoiceChip>
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
