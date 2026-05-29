CREATE TABLE "launchia_invite_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"issued_by_user_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "launchia_invite_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "launchia_magic_link_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"token_hash" "bytea" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "launchia_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"cover_image_url" text,
	"landing_page_url" text,
	"embed_enabled" boolean DEFAULT true NOT NULL,
	"idea_page_public" boolean DEFAULT false NOT NULL,
	"require_consent" boolean DEFAULT false NOT NULL,
	"allowed_origins" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "launchia_projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "launchia_rank_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"token_hash" "bytea" NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "launchia_rank_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "launchia_rank_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent_hash" "bytea"
);
--> statement-breakpoint
CREATE TABLE "launchia_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "launchia_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "launchia_waitlist_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"email" text NOT NULL,
	"source" text NOT NULL,
	"consent_at" timestamp with time zone,
	"position" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"email_anonymized" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "launchia_invite_codes" ADD CONSTRAINT "launchia_invite_codes_issued_by_user_id_launchia_users_id_fk" FOREIGN KEY ("issued_by_user_id") REFERENCES "public"."launchia_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "launchia_magic_link_tokens" ADD CONSTRAINT "launchia_magic_link_tokens_user_id_launchia_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."launchia_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "launchia_projects" ADD CONSTRAINT "launchia_projects_owner_user_id_launchia_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."launchia_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "launchia_rank_tokens" ADD CONSTRAINT "launchia_rank_tokens_entry_id_launchia_waitlist_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."launchia_waitlist_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "launchia_rank_views" ADD CONSTRAINT "launchia_rank_views_entry_id_launchia_waitlist_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."launchia_waitlist_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "launchia_waitlist_entries" ADD CONSTRAINT "launchia_waitlist_entries_project_id_launchia_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."launchia_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "launchia_magic_link_tokens_token_hash_idx" ON "launchia_magic_link_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "launchia_magic_link_tokens_email_idx" ON "launchia_magic_link_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "launchia_rank_views_entry_viewed_at_idx" ON "launchia_rank_views" USING btree ("entry_id","viewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "launchia_waitlist_entries_project_email_active_uidx" ON "launchia_waitlist_entries" USING btree ("project_id","email") WHERE "launchia_waitlist_entries"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "launchia_waitlist_entries_project_position_idx" ON "launchia_waitlist_entries" USING btree ("project_id","position");--> statement-breakpoint
CREATE INDEX "launchia_waitlist_entries_project_created_at_idx" ON "launchia_waitlist_entries" USING btree ("project_id","created_at");