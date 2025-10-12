/*
  Warnings:

  - The `userRole` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('STUDENT', 'INSTRUCTOR', 'ADMIN');

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "userRole",
ADD COLUMN     "userRole" "public"."Role" NOT NULL DEFAULT 'STUDENT';

-- DropEnum
DROP TYPE "public"."UserRole";
