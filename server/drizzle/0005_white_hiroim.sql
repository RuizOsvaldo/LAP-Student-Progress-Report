CREATE TABLE "pike13_admin_token" (
	"id" serial PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "github_username" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "pike13_sync_id" text;--> statement-breakpoint
ALTER TABLE "volunteer_hours" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_pike13_sync_id_unique" UNIQUE("pike13_sync_id");--> statement-breakpoint
ALTER TABLE "volunteer_hours" ADD CONSTRAINT "volunteer_hours_source_external_id_unique" UNIQUE("source","external_id");