DO $$
BEGIN
    CREATE TYPE "Role" AS ENUM ('USER', 'ASSISTANT', 'ERROR');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "Mode" AS ENUM ('BUILD', 'PLAN');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "MessageStatus" AS ENUM (
        'PENDING',
        'STREAMING',
        'COMPLETE',
        'ERROR'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Message"
    ALTER COLUMN "role" TYPE "Role"
        USING "role"::"Role",
    ALTER COLUMN "mode" TYPE "Mode"
        USING "mode"::"Mode",
    ALTER COLUMN "status" TYPE "MessageStatus"
        USING "status"::"MessageStatus";