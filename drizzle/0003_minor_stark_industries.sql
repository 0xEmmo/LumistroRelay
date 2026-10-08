ALTER TABLE `ai_runs` MODIFY COLUMN `mode` enum('llm','safety_rule','fallback','built_in') NOT NULL DEFAULT 'llm';--> statement-breakpoint
ALTER TABLE `brand_profiles` ADD `menuUrl` varchar(500);