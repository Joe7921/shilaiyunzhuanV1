CREATE TABLE `kitchen_pitfalls` (
	`recipe_id` text NOT NULL,
	`user_id` text NOT NULL,
	`topic` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`recipe_id`, `user_id`, `topic`)
);
--> statement-breakpoint
CREATE TABLE `kitchen_planner_state` (
	`user_id` text NOT NULL,
	`section` text NOT NULL,
	`data` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `section`)
);
