import { env } from "cloudflare:workers";

export type KitchenUser = { id: string; name: string };
type KitchenEnv = Cloudflare.Env & { OPENAI_API_KEY?: string };

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function environment(): KitchenEnv { return env as KitchenEnv; }

export function database(): D1Database {
  const db = environment().DB;
  if (!db) throw new HttpError(503, "小厨房的数据服务暂时不可用，请稍后再试。");
  return db;
}

export function bucket(): R2Bucket {
  const storage = environment().BUCKET;
  if (!storage) throw new HttpError(503, "照片存储暂时不可用，请稍后再试。");
  return storage;
}

// These headers are supplied and verified by the Sites authentication gateway.
// Never accept a user identity in JSON, query parameters, or browser storage.
export function getUser(request: Request): KitchenUser | null {
  const id = request.headers.get("oai-authenticated-user-id");
  if (!id || id.length > 256) return null;
  let name = request.headers.get("oai-authenticated-user-full-name");
  if (name && request.headers.get("oai-authenticated-user-full-name-encoding") === "percent-encoded-utf-8") {
    try { name = decodeURIComponent(name); } catch { name = null; }
  }
  // Do not expose the account email in a community author's display name.
  return { id, name: name?.trim().slice(0, 60) || "饭友" };
}

export function requireUser(request: Request): KitchenUser {
  const user = getUser(request);
  if (!user) throw new HttpError(401, "请先登录，再保存你的美食记录。");
  return user;
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) {
    throw new HttpError(403, "请从本站提交这次操作。");
  }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

export function fail(error: unknown): Response {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  console.error("Kitchen request failed", error instanceof Error ? error.message : "Unknown error");
  return json({ error: "小厨房暂时忙不过来，请稍后重试。" }, 500);
}

export async function readLimitedBody(request: Request, limit: number): Promise<Uint8Array> {
  const announced = Number(request.headers.get("content-length") || 0);
  if (announced > limit) throw new HttpError(413, "内容太大了，请缩小后重试。");
  if (!request.body) throw new HttpError(400, "没有收到提交的内容。");
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new HttpError(413, "内容太大了，请缩小后重试。");
    }
    parts.push(value);
  }
  const data = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) { data.set(part, offset); offset += part.byteLength; }
  return data;
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new HttpError(415, "请使用 JSON 提交内容。");
  const bytes = await readLimitedBody(request, 32 * 1024);
  let value: unknown;
  try { value = JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new HttpError(400, "提交的内容格式不正确。"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(400, "提交的内容格式不正确。");
  return value as Record<string, unknown>;
}

export function stringField(value: unknown, label: string, max: number, allowEmpty = false): string {
  if (typeof value !== "string") throw new HttpError(400, `请填写${label}。`);
  const text = value.trim();
  if ((!allowEmpty && !text) || text.length > max) throw new HttpError(400, `${label}请填写${allowEmpty ? "0" : "1"}–${max}个字符。`);
  return text;
}

export function idField(value: unknown, label = "编号"): string {
  const id = stringField(value, label, 100);
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new HttpError(400, `${label}格式不正确。`);
  return id;
}

export function uploadKey(value: unknown): string {
  if (typeof value !== "string" || !/^images\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(value)) throw new HttpError(400, "照片编号不正确，请重新上传。");
  return value;
}

export function imageUrl(key: string): string { return `/api/image?key=${encodeURIComponent(key)}`; }

// Capability stays false until an authorized image-model provider is connected.
export function aiAvailable(): boolean { return false; }
