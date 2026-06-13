// Server-side store for chat tool results (papers from a search), so follow-up
// tools (trends, citation network) can reference a compact `search_id` instead
// of round-tripping hundreds of papers through the model's context.
// Process-local: fine for the single Next.js server; entries expire after 30 min.

const TTL_MS = 30 * 60 * 1000;
const MAX_ENTRIES = 50;

interface Entry {
  papers: any[];
  query: string;
  createdAt: number;
}

const store = new Map<string, Entry>();

function prune() {
  const now = Date.now();

  store.forEach((v, k) => {
    if (now - v.createdAt > TTL_MS) store.delete(k);
  });
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

export function saveSearchResults(query: string, papers: any[]): string {
  prune();
  const id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  store.set(id, { papers, query, createdAt: Date.now() });
  return id;
}

export function getSearchResults(id: string): Entry | undefined {
  prune();
  return store.get(id);
}
