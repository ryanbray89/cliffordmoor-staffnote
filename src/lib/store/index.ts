import "server-only";

import { createLocalStore } from "@/lib/store/local";
import { createSupabaseStore } from "@/lib/store/supabase";
import type { Store } from "@/lib/store/types";

export type { Store } from "@/lib/store/types";

let singleton: Store | null = null;

export type StorageMode = "local" | "supabase";

export function storageMode(): StorageMode {
  const url = process.env.SUPABASE_URL?.trim() ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if ((url && !key) || (!url && key)) {
    throw new Error(
      "Set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or leave both empty to save on this computer.",
    );
  }
  return url && key ? "supabase" : "local";
}

export function getStore(): Store {
  if (!singleton) {
    singleton = storageMode() === "supabase" ? createSupabaseStore() : createLocalStore();
  }
  return singleton;
}

export function isEphemeralDeployment(mode: StorageMode): boolean {
  return process.env.VERCEL === "1" && mode === "local";
}
