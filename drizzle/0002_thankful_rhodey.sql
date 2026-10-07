CREATE TABLE `ai_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`brandId` int NOT NULL,
	`userId` int NOT NULL,
	`customerMessage` text NOT NULL,
	`decision` enum('ANSWER','ASK','HANDOFF') NOT NULL,
	`replyDraft` text NOT NULL,
	`confidence` int NOT NULL,
	`intent` varchar(160) NOT NULL,
	`missingInformation` text NOT NULL,
	`leadData` text NOT NULL,
	`internalReason` text NOT NULL,
	`sourceRecords` text NOT NULL,
	`promptVersion` varchar(80) NOT NULL,
	`model` varchar(80) NOT NULL,
	`mode` enum('llm','safety_rule','fallback') NOT NULL DEFAULT 'llm',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brand_faqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`brandId` int NOT NULL,
	`question` varchar(500) NOT NULL,
	`answer` text NOT NULL,
	`relatedPhrases` text NOT NULL,
	`isApproved` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_faqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brand_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`brandId` int NOT NULL,
	`industry` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`locations` text NOT NULL,
	`openingHours` text NOT NULL,
	`contactDetails` text NOT NULL,
	`deliveryAreas` text NOT NULL,
	`paymentMethods` text NOT NULL,
	`orderInstructions` text NOT NULL,
	`policies` text NOT NULL,
	`voice` enum('friendly','professional','premium','casual','playful','short_direct') NOT NULL DEFAULT 'friendly',
	`isApproved` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `brand_profiles_brand_unique` UNIQUE(`brandId`)
);
--> statement-breakpoint
CREATE TABLE `catalogue_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`brandId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`price` varchar(100),
	`variants` text NOT NULL,
	`availability` enum('available','unavailable','unknown') NOT NULL DEFAULT 'unknown',
	`imageUrl` varchar(500),
	`isApproved` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalogue_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `channel_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`brandId` int NOT NULL,
	`provider` enum('instagram','whatsapp') NOT NULL,
	`status` enum('disconnected','simulated_connected') NOT NULL DEFAULT 'disconnected',
	`isSimulation` boolean NOT NULL DEFAULT true,
	`connectedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channel_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `channel_connections_brand_provider_unique` UNIQUE(`brandId`,`provider`)
);
--> statement-breakpoint
ALTER TABLE `brands` ADD CONSTRAINT `brands_workspace_unique` UNIQUE(`workspaceId`);--> statement-breakpoint
ALTER TABLE `ai_runs` ADD CONSTRAINT `ai_runs_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_runs` ADD CONSTRAINT `ai_runs_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_runs` ADD CONSTRAINT `ai_runs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `brand_faqs` ADD CONSTRAINT `brand_faqs_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `brand_faqs` ADD CONSTRAINT `brand_faqs_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `brand_profiles` ADD CONSTRAINT `brand_profiles_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `brand_profiles` ADD CONSTRAINT `brand_profiles_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `catalogue_items` ADD CONSTRAINT `catalogue_items_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `catalogue_items` ADD CONSTRAINT `catalogue_items_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channel_connections` ADD CONSTRAINT `channel_connections_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channel_connections` ADD CONSTRAINT `channel_connections_brandId_brands_id_fk` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ai_runs_workspace_created_idx` ON `ai_runs` (`workspaceId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ai_runs_brand_created_idx` ON `ai_runs` (`brandId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `brand_faqs_brand_idx` ON `brand_faqs` (`brandId`);--> statement-breakpoint
CREATE INDEX `brand_faqs_workspace_idx` ON `brand_faqs` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `brand_profiles_workspace_idx` ON `brand_profiles` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `catalogue_items_brand_idx` ON `catalogue_items` (`brandId`);--> statement-breakpoint
CREATE INDEX `catalogue_items_workspace_idx` ON `catalogue_items` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `channel_connections_workspace_idx` ON `channel_connections` (`workspaceId`);