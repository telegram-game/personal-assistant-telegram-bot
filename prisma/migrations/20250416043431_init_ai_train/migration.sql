/*
  Warnings:

  - The `status` column on the `ai_models` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ai_models" DROP COLUMN "status",
ADD COLUMN     "status" "TrainDataStatus" NOT NULL DEFAULT 'PENDING';
