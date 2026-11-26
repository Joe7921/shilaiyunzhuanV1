import { database, HttpError, imageUrl } from "./http";

export type PostRow = {
  id: string; user_id: string; author_name: string; title: string; body: string;
  image_key: string | null; recipe_id: string | null; kcal: number | null; meal_estimate?:string|null;
  visibility: "private" | "community"; created_at: string; likes?: number; liked_by_me?: number;
};

export function serializePost(row: PostRow, userId: string) {
  return {
    id: row.id, title: row.title, body: row.body,
    imageUrl: row.image_key ? imageUrl(row.image_key) : null,
    recipeId: row.recipe_id, kcal: row.kcal, mealEstimate: row.meal_estimate?JSON.parse(row.meal_estimate):null, visibility: row.visibility,
    authorName: row.author_name, createdAt: row.created_at,
    likes: Number(row.likes || 0), likedByMe: Boolean(row.liked_by_me), isMine: row.user_id === userId,
  };
}

export async function accessiblePost(id: string, userId: string): Promise<PostRow> {
  const post = await database().prepare("SELECT * FROM kitchen_posts WHERE id = ? AND (user_id = ? OR visibility = 'community')").bind(id, userId).first<PostRow>();
  if (!post) throw new HttpError(404, "这条美食记录不存在，或你没有查看权限。");
  return post;
}

export async function getPoll(id: string, userId: string) {
  const db = database();
  const poll = await db.prepare("SELECT id, title, options FROM kitchen_polls WHERE id = ?").bind(id).first<{ id: string; title: string; options: string }>();
  if (!poll) throw new HttpError(404, "投票不存在，请检查朋友分享的链接。");
  const [counts, mine] = await Promise.all([
    db.prepare("SELECT option_id, COUNT(*) AS votes FROM kitchen_votes WHERE poll_id = ? GROUP BY option_id").bind(id).all<{ option_id: string; votes: number }>(),
    db.prepare("SELECT option_id FROM kitchen_votes WHERE poll_id = ? AND user_id = ?").bind(id, userId).first<{ option_id: string }>(),
  ]);
  const options = JSON.parse(poll.options) as { id: string; label: string }[];
  const voteMap = new Map(counts.results.map((row) => [row.option_id, Number(row.votes)]));
  return { id: poll.id, title: poll.title, options: options.map((option) => ({ ...option, votes: voteMap.get(option.id) || 0 })), totalVotes: counts.results.reduce((sum, row) => sum + Number(row.votes), 0), myVote: mine?.option_id || null };
}

export async function rateLimit(table: "kitchen_posts" | "kitchen_uploads" | "kitchen_polls", userId: string, maximum: number): Promise<void> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  // Table names are a closed server-side union; all user-controlled values are bound.
  const count = await database().prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE user_id = ? AND created_at > ?`).bind(userId, since).first<{ total: number }>();
  if (Number(count?.total || 0) >= maximum) throw new HttpError(429, "今天已经记录了很多美味，请明天再来吧。");
}
