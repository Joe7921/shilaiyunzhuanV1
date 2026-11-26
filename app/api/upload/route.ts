import { assertSameOrigin, bucket, database, fail, HttpError, imageUrl, json, readLimitedBody, requireUser } from "@/lib/server/http";
import { inspectImage } from "@/lib/server/images";
import { rateLimit } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = requireUser(request);
    const type = request.headers.get("content-type") || "";
    if (!type.toLowerCase().startsWith("multipart/form-data;") || type.length > 300) throw new HttpError(415, "请通过照片上传入口选择文件。");
    const raw = await readLimitedBody(request, 5 * 1024 * 1024 + 64 * 1024);
    let form: FormData;
    try { form = await new Response(raw.buffer as ArrayBuffer, { headers: { "content-type": type } }).formData(); }
    catch { throw new HttpError(400, "照片上传格式不正确，请重新选择。"); }
    const file = form.get("file");
    if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") throw new HttpError(400, "请先选择一张照片。");
    if (file.size < 1 || file.size > 5 * 1024 * 1024) throw new HttpError(413, "照片大小需要在 5 MB 以内。");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const info = inspectImage(bytes);
    await rateLimit("kitchen_uploads", user.id, 40);
    const key = `images/${crypto.randomUUID()}.${info.extension}`;
    const storage = bucket();
    await storage.put(key, bytes, { httpMetadata: { contentType: info.mime }, customMetadata: { owner: user.id } });
    try {
      await database().prepare("INSERT INTO kitchen_uploads (key, user_id, mime, bytes, width, height, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(key, user.id, info.mime, bytes.length, info.width, info.height, new Date().toISOString()).run();
    } catch (error) {
      await storage.delete(key);
      throw error;
    }
    return json({ imageKey: key, imageUrl: imageUrl(key) }, 201);
  } catch (error) { return fail(error); }
}
