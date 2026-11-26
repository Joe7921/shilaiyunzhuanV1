import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("kitchen_profiles", {
  userId: text("user_id").primaryKey(),
  favorites: text("favorites").notNull().default("[]"),
  personality: text("personality"),
  updatedAt: text("updated_at").notNull(),
});

export const uploads = sqliteTable("kitchen_uploads", {
  key: text("key").primaryKey(),
  userId: text("user_id").notNull(),
  mime: text("mime").notNull(),
  bytes: integer("bytes").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("kitchen_uploads_user_created").on(table.userId, table.createdAt)]);

export const posts = sqliteTable("kitchen_posts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  authorName: text("author_name").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  imageKey: text("image_key").references(() => uploads.key, { onDelete: "set null" }),
  recipeId: text("recipe_id"),
  kcal: real("kcal"),
  visibility: text("visibility", { enum: ["private", "community"] }).notNull().default("private"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("kitchen_posts_user_created").on(table.userId, table.createdAt),
  index("kitchen_posts_visibility_created").on(table.visibility, table.createdAt),
  index("kitchen_posts_image_key").on(table.imageKey),
]);

export const likes = sqliteTable("kitchen_likes", {
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  active: integer("active").notNull().default(1),
  createdAt: text("created_at").notNull(),
}, (table) => [primaryKey({ columns: [table.postId, table.userId] })]);

export const polls = sqliteTable("kitchen_polls", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  options: text("options").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("kitchen_polls_user_created").on(table.userId, table.createdAt)]);

export const votes = sqliteTable("kitchen_votes", {
  pollId: text("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  optionId: text("option_id").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [primaryKey({ columns: [table.pollId, table.userId] })]);

export const pitfalls = sqliteTable("kitchen_pitfalls", {
  recipeId: text("recipe_id").notNull(),
  userId: text("user_id").notNull(),
  topic: text("topic").notNull(),
  updatedAt: text("updated_at").notNull(),
}, table => [primaryKey({columns:[table.recipeId,table.userId,table.topic]})]);

export const plannerState = sqliteTable("kitchen_planner_state", {
  userId: text("user_id").notNull(),
  section: text("section").notNull(),
  data: text("data").notNull(),
  revision: integer("revision").notNull(),
  updatedAt: text("updated_at").notNull(),
}, table => [primaryKey({columns:[table.userId,table.section]})]);
