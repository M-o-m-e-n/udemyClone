/*
  Warnings:

  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "role",
ADD COLUMN     "userRole" "public"."UserRole" NOT NULL DEFAULT 'STUDENT';
