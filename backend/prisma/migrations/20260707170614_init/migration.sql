-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "gender" TEXT NOT NULL,
    "activity_level" TEXT NOT NULL,
    "wake_time" TEXT NOT NULL DEFAULT '07:00',
    "sleep_time" TEXT NOT NULL DEFAULT '23:00',
    "daily_goal" INTEGER NOT NULL,
    "manual_goal_override" BOOLEAN NOT NULL DEFAULT false,
    "unit_system" TEXT NOT NULL DEFAULT 'metric',
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "date" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "water_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "fixed_interval" BOOLEAN NOT NULL DEFAULT true,
    "interval_minutes" INTEGER NOT NULL DEFAULT 60,
    "morning_boost" BOOLEAN NOT NULL DEFAULT true,
    "post_meal" BOOLEAN NOT NULL DEFAULT true,
    "evening_winddown" BOOLEAN NOT NULL DEFAULT true,
    "dnd_enabled" BOOLEAN NOT NULL DEFAULT false,
    "dnd_start" TEXT NOT NULL DEFAULT '22:00',
    "dnd_end" TEXT NOT NULL DEFAULT '07:00',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "water_entries_user_id_date_idx" ON "water_entries"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "reminder_settings_user_id_key" ON "reminder_settings"("user_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_entries" ADD CONSTRAINT "water_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_settings" ADD CONSTRAINT "reminder_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
