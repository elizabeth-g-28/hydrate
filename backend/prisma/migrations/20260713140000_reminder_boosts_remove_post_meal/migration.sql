-- AlterTable
ALTER TABLE "reminder_settings" DROP COLUMN IF EXISTS "post_meal";

-- AlterTable
ALTER TABLE "reminder_settings" ADD COLUMN IF NOT EXISTS "last_morning_boost_at" TIMESTAMP(3);
ALTER TABLE "reminder_settings" ADD COLUMN IF NOT EXISTS "last_evening_winddown_at" TIMESTAMP(3);
