CREATE TABLE `kitchen_likes` (
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`post_id`, `user_id`),
	FOREIGN KEY (`post_id`) REFERENCES `kitchen_posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `kitchen_polls` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`options` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `kitchen_polls_user_created` ON `kitchen_polls` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `kitchen_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`author_name` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`image_key` text,
	`recipe_id` text,
	`kcal` real,
	`visibility` text DEFAULT 'private' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`image_key`) REFERENCES `kitchen_uploads`(`key`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `kitchen_posts_user_created` ON `kitchen_posts` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `kitchen_posts_visibility_created` ON `kitchen_posts` (`visibility`,`created_at`);--> statement-breakpoint
CREATE INDEX `kitchen_posts_image_key` ON `kitchen_posts` (`image_key`);--> statement-breakpoint
CREATE TABLE `kitchen_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`favorites` text DEFAULT '[]' NOT NULL,
	`personality` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `kitchen_uploads` (
	`key` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `kitchen_uploads_user_created` ON `kitchen_uploads` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `kitchen_votes` (
	`poll_id` text NOT NULL,
	`user_id` text NOT NULL,
	`option_id` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`poll_id`, `user_id`),
	FOREIGN KEY (`poll_id`) REFERENCES `kitchen_polls`(`id`) ON UPDATE no action ON DELETE cascade
);
