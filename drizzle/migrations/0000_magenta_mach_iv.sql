CREATE TABLE `files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_id` text NOT NULL,
	`r2_path` text NOT NULL,
	`file_type` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`expires_at` text NOT NULL,
	`deleted_at` text,
	`status` text DEFAULT 'active'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `files_file_id_unique` ON `files` (`file_id`);--> statement-breakpoint
CREATE INDEX `idx_file_id` ON `files` (`file_id`);--> statement-breakpoint
CREATE INDEX `idx_expires_at` ON `files` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `files` (`status`);