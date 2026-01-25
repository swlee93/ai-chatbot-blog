CREATE TABLE IF NOT EXISTS "BlogReference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"messageId" uuid NOT NULL,
	"chatId" uuid NOT NULL,
	"filePath" text NOT NULL,
	"title" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "BlogReference" ADD CONSTRAINT "BlogReference_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message_v2"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "BlogReference" ADD CONSTRAINT "BlogReference_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
