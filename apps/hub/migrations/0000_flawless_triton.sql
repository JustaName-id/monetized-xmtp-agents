CREATE TABLE "approval_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"permission_id" uuid NOT NULL,
	"transaction_hash" varchar(66) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revocation_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"permission_id" uuid NOT NULL,
	"transaction_hash" varchar(66) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spend_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"permission_id" uuid NOT NULL,
	"transaction_hash" varchar(66) NOT NULL,
	"value" numeric(78) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spend_permissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"hash" varchar(66) NOT NULL,
	"account" varchar(42) NOT NULL,
	"spender" varchar(42) NOT NULL,
	"token" varchar(42) NOT NULL,
	"allowance" numeric(78) NOT NULL,
	"period" integer NOT NULL,
	"start" timestamp NOT NULL,
	"end" timestamp NOT NULL,
	"salt" numeric(78) NOT NULL,
	"extra_data" text,
	"is_valid" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "approval_events" ADD CONSTRAINT "approval_events_permission_id_spend_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."spend_permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revocation_events" ADD CONSTRAINT "revocation_events_permission_id_spend_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."spend_permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spend_events" ADD CONSTRAINT "spend_events_permission_id_spend_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."spend_permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_idx" ON "spend_permissions" USING btree ("account");--> statement-breakpoint
CREATE INDEX "spender_idx" ON "spend_permissions" USING btree ("spender");--> statement-breakpoint
CREATE INDEX "token_idx" ON "spend_permissions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "account_spender_idx" ON "spend_permissions" USING btree ("account","spender");