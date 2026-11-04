"use client";

import { deleteEntry } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function RemoveLog({ id }: { id: string }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" className="h-11 px-2 text-muted-foreground" />}>
        Remove
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg">Remove this log?</DialogTitle>
          <DialogDescription>
            It leaves Staff Note, including any photo and replies. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-stretch">
          <form action={deleteEntry} className="w-full">
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="destructive" className="h-12 w-full rounded-2xl text-base">
              Remove log
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
