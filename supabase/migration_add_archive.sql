-- Run this in Supabase SQL Editor AFTER migration_add_games.sql
-- Adds archive flag and reveal date

ALTER TABLE lottery_games
  ADD COLUMN is_archived BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN reveal_date DATE;

ALTER TABLE lottery_cards
  ADD COLUMN is_archived BOOLEAN DEFAULT FALSE NOT NULL;
