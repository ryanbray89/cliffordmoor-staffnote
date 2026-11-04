import { getStore, storageMode, type StorageMode, type Store } from "@/lib/store";

export async function openBook(): Promise<
  | { ok: true; store: Store; mode: StorageMode }
  | { ok: false; message: string }
> {
  try {
    const mode = storageMode();
    return { ok: true, store: getStore(), mode };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The book is not set up.",
    };
  }
}
