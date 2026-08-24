-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "logoUrl" TEXT,
    "conference" TEXT,
    "division" TEXT,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "imageUrl" TEXT,
    "careerStartYear" INTEGER,
    "careerEndYear" INTEGER,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_stints" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "stintOrder" INTEGER NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER NOT NULL,
    "gamesPlayed" INTEGER NOT NULL,

    CONSTRAINT "career_stints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_puzzles" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "puzzleNumber" INTEGER NOT NULL,
    "playerId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "maxAttempts" INTEGER NOT NULL DEFAULT 6,

    CONSTRAINT "daily_puzzles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "displayName" TEXT,
    "anonymousId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_results" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "won" BOOLEAN NOT NULL,
    "attempts" INTEGER NOT NULL,
    "guesses" JSONB NOT NULL,
    "feedback" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_abbreviation_key" ON "teams"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "players_firstName_lastName_key" ON "players"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "career_stints_playerId_idx" ON "career_stints"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "career_stints_playerId_stintOrder_key" ON "career_stints"("playerId", "stintOrder");

-- CreateIndex
CREATE UNIQUE INDEX "daily_puzzles_date_key" ON "daily_puzzles"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_puzzles_puzzleNumber_key" ON "daily_puzzles"("puzzleNumber");

-- CreateIndex
CREATE INDEX "daily_puzzles_date_idx" ON "daily_puzzles"("date");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_anonymousId_key" ON "users"("anonymousId");

-- CreateIndex
CREATE INDEX "daily_results_userId_idx" ON "daily_results"("userId");

-- CreateIndex
CREATE INDEX "daily_results_puzzleId_idx" ON "daily_results"("puzzleId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_results_userId_puzzleId_key" ON "daily_results"("userId", "puzzleId");

-- AddForeignKey
ALTER TABLE "career_stints" ADD CONSTRAINT "career_stints_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_stints" ADD CONSTRAINT "career_stints_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_puzzles" ADD CONSTRAINT "daily_puzzles_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_results" ADD CONSTRAINT "daily_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_results" ADD CONSTRAINT "daily_results_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "daily_puzzles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
