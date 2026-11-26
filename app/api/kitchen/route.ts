import { aiAvailable, assertSameOrigin, database, fail, getUser, HttpError, idField, json, readJson, requireUser, stringField, uploadKey } from "@/lib/server/http";
import { accessiblePost, getPoll, rateLimit, serializePost, type PostRow } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const resource = url.searchParams.get("resource");
    if (resource === "me") return json({ user: getUser(request), aiAvailable: aiAvailable() });
    const user = requireUser(request);
    const db = database();
    if (resource === "profile") {
      const profile = await db.prepare("SELECT favorites, personality FROM kitchen_profiles WHERE user_id = ?").bind(user.id).first<{ favorites: string; personality: string | null }>();
      return json({ favorites: profile ? JSON.parse(profile.favorites) : [], personality: profile?.personality || null });
    }
    if (resource === "posts") {
      const scope = url.searchParams.get("scope") || "community";
      if (scope !== "community" && scope !== "mine") throw new HttpError(400, "记录范围不正确。");
      const filter = scope === "mine" ? "p.user_id = ?" : "p.visibility = 'community'";
      const stmt = db.prepare(`SELECT p.*, (SELECT COUNT(*) FROM kitchen_likes l WHERE l.post_id = p.id AND l.active = 1) AS likes, EXISTS(SELECT 1 FROM kitchen_likes l WHERE l.post_id = p.id AND l.user_id = ? AND l.active = 1) AS liked_by_me FROM kitchen_posts p WHERE ${filter} ORDER BY p.created_at DESC, p.id DESC LIMIT 100`);
      const result = await (scope === "mine" ? stmt.bind(user.id, user.id) : stmt.bind(user.id)).all<PostRow>();
      return json({ posts: result.results.map((post) => serializePost(post, user.id)) });
    }
    if (resource === "polls") {
      const result = await db.prepare("SELECT p.id, p.title, p.created_at, (SELECT COUNT(*) FROM kitchen_votes v WHERE v.poll_id = p.id) AS total_votes FROM kitchen_polls p WHERE p.user_id = ? ORDER BY p.created_at DESC, p.id DESC LIMIT 20").bind(user.id).all<{ id: string; title: string; created_at: string; total_votes: number }>();
      return json({ polls: result.results.map((poll) => ({ id: poll.id, title: poll.title, totalVotes: Number(poll.total_votes), createdAt: poll.created_at })) });
    }
    if (resource === "poll") return json({ poll: await getPoll(idField(url.searchParams.get("id"), "投票编号"), user.id) });
    throw new HttpError(400, "没有找到这个厨房功能。");
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = requireUser(request);
    const body = await readJson(request);
    const db = database();
    const now = new Date().toISOString();
    if (body.action === "save-profile") {
      if (body.favorites === undefined && body.personality === undefined) throw new HttpError(400, "没有需要保存的内容。");
      let favorites: string[] = [];
      if (body.favorites !== undefined) {
        if (!Array.isArray(body.favorites) || body.favorites.length > 1000) throw new HttpError(400, "最多可以收藏 1000 道菜。");
        favorites = [...new Set(body.favorites.map((value) => idField(value, "菜谱编号")))];
      }
      const personality = body.personality === undefined || body.personality === null ? null : stringField(body.personality, "美食人格", 100);
      // Preserve unrelated profile fields even when two different panels save together.
      await db.prepare("INSERT INTO kitchen_profiles (user_id, favorites, personality, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET favorites = CASE WHEN ? THEN excluded.favorites ELSE kitchen_profiles.favorites END, personality = CASE WHEN ? THEN excluded.personality ELSE kitchen_profiles.personality END, updated_at = excluded.updated_at").bind(user.id, JSON.stringify(favorites), personality, now, body.favorites !== undefined ? 1 : 0, body.personality !== undefined ? 1 : 0).run();
      const saved = await db.prepare("SELECT favorites, personality FROM kitchen_profiles WHERE user_id = ?").bind(user.id).first<{ favorites: string; personality: string | null }>();
      return json({ favorites: saved ? JSON.parse(saved.favorites) : [], personality: saved?.personality || null });
    }
    if (body.action === "create-post") {
      const title = stringField(body.title, "菜名", 80);
      const caption = stringField(body.body ?? "", "这餐的故事", 2000, true);
      if (body.visibility !== "private" && body.visibility !== "community") throw new HttpError(400, "请选择记录的可见范围。");
      const imageKey = body.imageKey === undefined || body.imageKey === null ? null : uploadKey(body.imageKey);
      const recipeId = body.recipeId === undefined || body.recipeId === null ? null : idField(body.recipeId, "菜谱编号");
      const kcal = body.kcal === undefined || body.kcal === null ? null : body.kcal;
      if (kcal !== null && (typeof kcal !== "number" || !Number.isFinite(kcal) || kcal < 0 || kcal > 20000)) throw new HttpError(400, "热量请输入 0–20000 范围内的数值。");
      if (imageKey) {
        const upload = await db.prepare("SELECT key FROM kitchen_uploads WHERE key = ? AND user_id = ?").bind(imageKey, user.id).first();
        if (!upload) throw new HttpError(403, "这张照片不属于你，请重新上传。");
      }
      if (imageKey) {
        const photo = await db.prepare("SELECT key FROM kitchen_uploads WHERE key = ? AND user_id = ?").bind(imageKey, user.id).first();
        if (!photo) throw new HttpError(400, "请选择自己已上传的照片。");
      }
      await rateLimit("kitchen_posts", user.id, 100);
      const id = crypto.randomUUID();
      await db.prepare("INSERT INTO kitchen_posts (id, user_id, author_name, title, body, image_key, recipe_id, kcal, visibility, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(id, user.id, user.name, title, caption, imageKey, recipeId, kcal, body.visibility, now).run();
      return json({ post: serializePost({ id, user_id: user.id, author_name: user.name, title, body: caption, image_key: imageKey, recipe_id: recipeId, kcal: kcal as number | null, visibility: body.visibility, created_at: now }, user.id) }, 201);
    }
    if (body.action === "delete-post") {
      const id = idField(body.id, "记录编号");
      const result = await db.prepare("DELETE FROM kitchen_posts WHERE id = ? AND user_id = ?").bind(id, user.id).run();
      if (!result.meta.changes) throw new HttpError(404, "记录不存在，或你没有删除权限。");
      return json({ success: true });
    }
    if (body.action === "toggle-like") {
      const id = idField(body.id, "记录编号");
      await accessiblePost(id, user.id);
      // The composite key and one upsert make a toggle atomic under concurrency.
      await db.prepare("INSERT INTO kitchen_likes (post_id, user_id, active, created_at) VALUES (?, ?, 1, ?) ON CONFLICT(post_id, user_id) DO UPDATE SET active = 1 - kitchen_likes.active").bind(id, user.id, now).run();
      const result = await db.prepare("SELECT COUNT(*) AS likes, EXISTS(SELECT 1 FROM kitchen_likes WHERE post_id = ? AND user_id = ? AND active = 1) AS liked FROM kitchen_likes WHERE post_id = ? AND active = 1").bind(id, user.id, id).first<{ likes: number; liked: number }>();
      return json({ likes: Number(result?.likes || 0), liked: Boolean(result?.liked) });
    }
    if (body.action === "create-poll") {
      const title = stringField(body.title, "投票标题", 100);
      if (!Array.isArray(body.options) || body.options.length < 2 || body.options.length > 6) throw new HttpError(400, "请选择 2–6 道菜发起投票。");
      const options = body.options.map((value) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(400, "投票选项格式不正确。");
        return { id: idField(value.id, "选项编号"), label: stringField(value.label, "选项名称", 80) };
      });
      if (new Set(options.map((option) => option.id)).size !== options.length || new Set(options.map((option) => option.label)).size !== options.length) throw new HttpError(400, "投票选项不能重复。");
      await rateLimit("kitchen_polls", user.id, 30);
      const id = crypto.randomUUID();
      await db.prepare("INSERT INTO kitchen_polls (id, user_id, title, options, created_at) VALUES (?, ?, ?, ?, ?)").bind(id, user.id, title, JSON.stringify(options), now).run();
      return json({ poll: { id, title, options: options.map((option) => ({ ...option, votes: 0 })), totalVotes: 0, myVote: null } }, 201);
    }
    if (body.action === "vote") {
      const id = idField(body.id, "投票编号");
      const optionId = idField(body.optionId, "选项编号");
      const poll = await getPoll(id, user.id);
      if (!poll.options.some((option) => option.id === optionId)) throw new HttpError(400, "这个选项不属于当前投票。");
      await db.prepare("INSERT INTO kitchen_votes (poll_id, user_id, option_id, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(poll_id, user_id) DO UPDATE SET option_id = excluded.option_id, updated_at = excluded.updated_at").bind(id, user.id, optionId, now).run();
      return json({ poll: await getPoll(id, user.id) });
    }
    throw new HttpError(400, "没有找到这项操作。");
  } catch (error) { return fail(error); }
}
