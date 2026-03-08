-- EOS Capital Tech Portal — Full Schema Migration
-- Paste this into Supabase SQL Editor and click Run

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STANDARD', 'AURUM', 'BOARDROOM', 'ADMIN');
CREATE TYPE "PostTag" AS ENUM ('PAYOUT', 'AURUM_RESULTS', 'CHALLENGE_PASSED', 'GENERAL', 'QUESTION');
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "EAStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'COMING_SOON');
CREATE TYPE "FileType" AS ENUM ('EA_FILE', 'SET_FILE', 'PDF_GUIDE', 'BROKER_SETTINGS');

-- CreateTable: User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STANDARD',
    "referralCode" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "communityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "payoutUpdates" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateTable: Post
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tag" "PostTag" NOT NULL DEFAULT 'GENERAL',
    "amount" DECIMAL(12,2),
    "imageUrl" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Comment
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Like
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Like_postId_userId_key" ON "Like"("postId", "userId");

-- CreateTable: EA
CREATE TABLE "EA" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "requiredRole" "Role" NOT NULL DEFAULT 'STANDARD',
    "status" "EAStatus" NOT NULL DEFAULT 'ACTIVE',
    "downloadUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EA_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserEA
CREATE TABLE "UserEA" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eaId" TEXT NOT NULL,
    "accountNumber" TEXT,
    "broker" TEXT,
    "status" "EAStatus" NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserEA_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserEA_userId_eaId_key" ON "UserEA"("userId", "eaId");

-- CreateTable: Download
CREATE TABLE "Download" (
    "id" TEXT NOT NULL,
    "eaId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileType" "FileType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "requiredRole" "Role" NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Video
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" TEXT,
    "embedUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "thumbnail" TEXT,
    "requiredRole" "Role" NOT NULL DEFAULT 'STANDARD',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SupportTicket
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "screenshotUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TicketReply
CREATE TABLE "TicketReply" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LeaderboardEntry
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "system" TEXT NOT NULL,
    "propFirm" TEXT,
    "payout" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LeaderboardEntry_userId_month_year_key" ON "LeaderboardEntry"("userId", "month", "year");

-- CreateTable: TickerItem
CREATE TABLE "TickerItem" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TickerItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Referral
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "signedUp" BOOLEAN NOT NULL DEFAULT false,
    "isConverted" BOOLEAN NOT NULL DEFAULT false,
    "convertedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Like" ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserEA" ADD CONSTRAINT "UserEA_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserEA" ADD CONSTRAINT "UserEA_eaId_fkey" FOREIGN KEY ("eaId") REFERENCES "EA"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Download" ADD CONSTRAINT "Download_eaId_fkey" FOREIGN KEY ("eaId") REFERENCES "EA"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketReply" ADD CONSTRAINT "TicketReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketReply" ADD CONSTRAINT "TicketReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_convertedUserId_fkey" FOREIGN KEY ("convertedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: EAs
INSERT INTO "EA" ("id", "name", "description", "version", "requiredRole", "status") VALUES
('ea-omni', 'Omni EA', 'Multi-strategy EA for prop firms', '2.2', 'STANDARD', 'ACTIVE'),
('ea-asia', 'Asia Scalper', 'Asian session scalping strategy', '2.1', 'STANDARD', 'ACTIVE'),
('ea-aurum', 'Aurum EA', 'Flagship 9-strategy system', '4.2', 'AURUM', 'ACTIVE');

-- Seed: Downloads
INSERT INTO "Download" ("id", "eaId", "name", "description", "fileType", "fileUrl", "version", "isLatest", "requiredRole") VALUES
('dl-1', 'ea-omni', 'Omni EA v2.2', 'EA File · v2.2', 'EA_FILE', '#', '2.2', true, 'STANDARD'),
('dl-2', 'ea-omni', 'Omni Setup Guide', 'Setup Guide · v2', 'PDF_GUIDE', '#', '2.0', true, 'STANDARD'),
('dl-3', 'ea-omni', 'Omni Set Files Pack', 'Set Files · v2', 'SET_FILE', '#', '2.0', true, 'STANDARD'),
('dl-4', 'ea-omni', 'Omni Broker Settings', 'Broker Settings · v1', 'BROKER_SETTINGS', '#', '1.0', true, 'STANDARD'),
('dl-5', 'ea-asia', 'Asia Scalper EA v2.1', 'EA File · v2.1', 'EA_FILE', '#', '2.1', true, 'STANDARD'),
('dl-6', 'ea-asia', 'Asia Scalper Guide', 'Setup Guide · v2', 'PDF_GUIDE', '#', '2.0', true, 'STANDARD'),
('dl-7', 'ea-asia', 'Asia Scalper Set Files', 'Set Files · v2.1', 'SET_FILE', '#', '2.1', true, 'STANDARD'),
('dl-8', 'ea-aurum', 'Aurum EA v4.2', 'EA File · v4.2', 'EA_FILE', '#', '4.2', true, 'AURUM'),
('dl-9', 'ea-aurum', 'Aurum Setup Guide', 'Setup Guide · v4', 'PDF_GUIDE', '#', '4.0', true, 'AURUM'),
('dl-10', 'ea-aurum', 'Aurum Set Files', 'Set Files · v4.2', 'SET_FILE', '#', '4.2', true, 'AURUM');

-- Seed: Videos
INSERT INTO "Video" ("id", "title", "duration", "embedUrl", "category", "isFeatured", "requiredRole", "sortOrder") VALUES
('vid-1', 'Getting Started with Omni EA', '8:21', 'https://loom.com/share/placeholder', 'Getting Started', false, 'STANDARD', 1),
('vid-2', 'Installing Your EA on MT4/MT5', '8:15', 'https://loom.com/share/placeholder', 'Getting Started', false, 'STANDARD', 2),
('vid-3', 'FTMO Challenge Setup Guide', '12:20', 'https://loom.com/share/placeholder', 'Prop Firm Guides', false, 'STANDARD', 3),
('vid-4', 'MyForexFunds Best Practices', '11:00', 'https://loom.com/share/placeholder', 'Prop Firm Guides', false, 'STANDARD', 4),
('vid-5', 'Risk Management Fundamentals', '12:30', 'https://loom.com/share/placeholder', 'Risk Management', false, 'STANDARD', 5),
('vid-6', 'Position Sizing for Prop Firms', '9:45', 'https://loom.com/share/placeholder', 'Risk Management', false, 'STANDARD', 6),
('vid-7', 'How Top Clients Scale to £10k+/mo', '25:18', 'https://loom.com/share/placeholder', 'Scaling', true, 'STANDARD', 7),
('vid-8', 'Multi-Account Management', '14:30', 'https://loom.com/share/placeholder', 'Scaling', false, 'STANDARD', 8);

-- Seed: Ticker Items
INSERT INTO "TickerItem" ("id", "text", "amount", "isActive", "sortOrder") VALUES
('tick-1', 'Marcus T. — Aurum payout', 4218, true, 1),
('tick-2', 'James R. — Omni payout', 1847, true, 2),
('tick-3', 'Karen W. — Just activated Aurum 🚀', null, true, 3),
('tick-4', 'Larry O. — Aurum payout', 5604, true, 4),
('tick-5', 'Sarah B. — Omni payout', 3210, true, 5),
('tick-6', 'Gio A. — Aurum payout', 8613, true, 6),
('tick-7', 'Dave H. — Challenge passed ✅', null, true, 7);
