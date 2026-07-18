import type { EdgeKVNamespace, EdgeCache } from "../../src/kv/types.js";

/** In-memory KV that satisfies the subset of EdgeKVNamespace we use. */
export class FakeKV implements EdgeKVNamespace {
  private store = new Map<string, string>();

  seedJSON(key: string, value: unknown): void {
    this.store.set(key, JSON.stringify(value));
  }

  async get(key: string, type?: "text" | "json"): Promise<any> {
    const raw = this.store.get(key);
    if (raw == null) return null;
    return type === "json" ? JSON.parse(raw) : raw;
  }

  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(options?: { prefix?: string }) {
    const keys = [...this.store.keys()]
      .filter((k) => !options?.prefix || k.startsWith(options.prefix))
      .map((name) => ({ name }));
    return { keys, list_complete: true };
  }
}

/** In-memory Cache API implementation keyed by URL string. */
export class FakeCache implements EdgeCache {
  private store = new Map<string, Response>();

  private key(req: Request | string): string {
    return typeof req === "string" ? req : req.url;
  }

  async match(req: Request | string): Promise<Response | undefined> {
    const hit = this.store.get(this.key(req));
    return hit ? hit.clone() : undefined;
  }

  async put(req: Request | string, res: Response): Promise<void> {
    this.store.set(this.key(req), res.clone());
  }

  async delete(req: Request | string): Promise<boolean> {
    return this.store.delete(this.key(req));
  }
}
