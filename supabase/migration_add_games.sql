-- Run this in Supabase SQL Editor AFTER the original schema.sql
-- This adds the lottery_games table and links it to lottery_cards

CREATE TABLE lottery_games (
  id           UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT          NOT NULL,
  entry_fee    NUMERIC(10,2) NOT NULL,
  prize_title  TEXT          NOT NULL,
  prize_amount TEXT          NOT NULL,
  created_at   TIMESTAMPTZ   DEFAULT NOW() NOT NULL
);

-- Add game reference to existing cards table (nullable for backward compatibility)
ALTER TABLE lottery_cards
  ADD COLUMN game_id UUID REFERENCES lottery_games(id);
