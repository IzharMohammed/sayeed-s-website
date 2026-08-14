INSERT INTO "shops" ("name", "code", "setup_complete")
SELECT 'My Workshop', 'WORKSHOP', true
WHERE EXISTS (SELECT 1 FROM "users")
  AND NOT EXISTS (SELECT 1 FROM "shops");--> statement-breakpoint
WITH "canonical_shop" AS (
	SELECT "shops"."id"
	FROM "shops"
	LEFT JOIN "orders" ON "orders"."shop_id" = "shops"."id"
	GROUP BY "shops"."id", "shops"."created_at"
	ORDER BY count("orders"."id") DESC, "shops"."created_at", "shops"."id"
	LIMIT 1
), "next_order_numbers" AS (
	SELECT
		"orders"."id",
		coalesce((SELECT max("order_number") FROM "orders" WHERE "shop_id" = (SELECT "id" FROM "canonical_shop")), 0)
		+ row_number() OVER (ORDER BY "orders"."created_at", "orders"."id") AS "order_number"
	FROM "orders"
	WHERE "shop_id" <> (SELECT "id" FROM "canonical_shop")
)
UPDATE "orders"
SET "order_number" = "next_order_numbers"."order_number"
FROM "next_order_numbers"
WHERE "orders"."id" = "next_order_numbers"."id";--> statement-breakpoint
WITH "canonical_shop" AS (
	SELECT "shops"."id"
	FROM "shops"
	LEFT JOIN "orders" ON "orders"."shop_id" = "shops"."id"
	GROUP BY "shops"."id", "shops"."created_at"
	ORDER BY count("orders"."id") DESC, "shops"."created_at", "shops"."id"
	LIMIT 1
)
UPDATE "orders" SET "shop_id" = (SELECT "id" FROM "canonical_shop");--> statement-breakpoint
WITH "ranked_users" AS (
	SELECT
		"id",
		row_number() OVER (PARTITION BY "username" ORDER BY "created_at", "id") AS "position"
	FROM "users"
)
UPDATE "users"
SET "username" = left("users"."username", 20) || '_' || left(replace("users"."id"::text, '-', ''), 8)
FROM "ranked_users"
WHERE "users"."id" = "ranked_users"."id" AND "ranked_users"."position" > 1;--> statement-breakpoint
DROP INDEX "users_shop_username_unique";--> statement-breakpoint
UPDATE "users"
SET "shop_id" = (SELECT "id" FROM "shops" ORDER BY "created_at", "id" LIMIT 1)
WHERE "shop_id" IS NULL;--> statement-breakpoint
WITH "canonical_shop" AS (
	SELECT "shops"."id"
	FROM "shops"
	LEFT JOIN "orders" ON "orders"."shop_id" = "shops"."id"
	GROUP BY "shops"."id", "shops"."created_at"
	ORDER BY count("orders"."id") DESC, "shops"."created_at", "shops"."id"
	LIMIT 1
)
UPDATE "users" SET "shop_id" = (SELECT "id" FROM "canonical_shop");--> statement-breakpoint
WITH "canonical_shop" AS (
	SELECT "shops"."id"
	FROM "shops"
	LEFT JOIN "orders" ON "orders"."shop_id" = "shops"."id"
	GROUP BY "shops"."id", "shops"."created_at"
	ORDER BY count("orders"."id") DESC, "shops"."created_at", "shops"."id"
	LIMIT 1
)
UPDATE "activity_logs" SET "shop_id" = (SELECT "id" FROM "canonical_shop");--> statement-breakpoint
WITH "canonical_shop" AS (
	SELECT "shops"."id"
	FROM "shops"
	LEFT JOIN "orders" ON "orders"."shop_id" = "shops"."id"
	GROUP BY "shops"."id", "shops"."created_at"
	ORDER BY count("orders"."id") DESC, "shops"."created_at", "shops"."id"
	LIMIT 1
)
DELETE FROM "shops" WHERE "id" <> (SELECT "id" FROM "canonical_shop");--> statement-breakpoint
UPDATE "users" SET "role" = 'OWNER' WHERE "role" = 'PLATFORM_ADMIN';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."role";--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('OWNER', 'WORKER');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "shop_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_unique" ON "users" USING btree ("username");
