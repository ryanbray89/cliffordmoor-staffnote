import type { StorageMode } from "@/lib/store";
import { isEphemeralDeployment } from "@/lib/store";

export function StorageBanner({
  mode,
  onlyDanger = false,
}: {
  mode: StorageMode;
  onlyDanger?: boolean;
}) {
  if (isEphemeralDeployment(mode)) {
    return (
      <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
        This copy is saving on a temporary disk. Logs will disappear. Connect Supabase before the yard uses it.
      </p>
    );
  }
  if (onlyDanger) return null;
  if (mode === "local") {
    return (
      <p className="text-sm text-muted-foreground">
        Saving on this computer, in data/staff-note.json. Connect Supabase before you deploy.
      </p>
    );
  }
  return <p className="text-sm text-muted-foreground">Saving in Supabase.</p>;
}
