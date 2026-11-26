import { bucket, database, fail, HttpError, requireUser, uploadKey } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    const key = uploadKey(new URL(request.url).searchParams.get("key"));
    const db = database();
    const image = await db.prepare("SELECT user_id, mime FROM kitchen_uploads WHERE key = ?").bind(key).first<{ user_id: string; mime: string }>();
    if (!image) throw new HttpError(404, "照片不存在。");
    if (image.user_id !== user.id) {
      const shared = await db.prepare("SELECT id FROM kitchen_posts WHERE image_key = ? AND visibility = 'community' LIMIT 1").bind(key).first();
      if (!shared) throw new HttpError(404, "照片不存在，或你没有查看权限。");
    }
    const object = await bucket().get(key);
    if (!object) throw new HttpError(404, "照片不存在。");
    return new Response(object.body, { headers: { "Content-Type": image.mime, "Content-Length": String(object.size), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'", "Content-Disposition": "inline" } });
  } catch (error) { return fail(error); }
}
