CREATE TABLE `brands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(160) NOT NULL,
	`websiteUrl` varchar(255),
	`isDemo` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brands_id` PRIMARY KEY(`id`),
	CONSTRAINT `brands_workspace_slug_unique` UNIQUE(`workspaceId`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `workspace_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','member') NOT NULL DEFAULT 'owner',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspace_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_members_workspace_user_unique` UNIQUE(`workspaceId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(160) NOT NULL,
	`ownerUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaces_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `brands` ADD CONSTRAINT `brands_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspace_members` ADD CONSTRAINT `workspace_members_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspace_members` ADD CONSTRAINT `workspace_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaces` ADD CONSTRAINT `workspaces_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `brands_workspace_idx` ON `brands` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `workspace_members_user_idx` ON `workspace_members` (`userId`);