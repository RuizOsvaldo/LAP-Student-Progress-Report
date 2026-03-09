CREATE TABLE "volunteer_hours" (
	"id" serial PRIMARY KEY NOT NULL,
	"volunteer_name" text NOT NULL,
	"category" text NOT NULL,
	"hours" real NOT NULL,
	"description" text,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL
);
