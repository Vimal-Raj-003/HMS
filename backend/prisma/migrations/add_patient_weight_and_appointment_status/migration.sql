-- Add weight column to patients table
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "weight" DECIMAL(5,2);

-- Add PENDING_APPROVAL and REJECTED to appointment status enum
-- First, drop the default constraint
ALTER TABLE "appointments" ALTER COLUMN "status" DROP DEFAULT;

-- Create new enum type with additional values
CREATE TYPE "AppointmentStatus_new" AS ENUM ('PENDING_APPROVAL', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW');

-- Migrate data to new enum type
ALTER TABLE "appointments" ALTER COLUMN "status" TYPE "AppointmentStatus_new" USING ("status"::text::"AppointmentStatus_new");

-- Drop old enum type
DROP TYPE "AppointmentStatus";

-- Rename new enum type to original name
ALTER TYPE "AppointmentStatus_new" RENAME TO "AppointmentStatus";

-- Restore default value
ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'PENDING_APPROVAL';
