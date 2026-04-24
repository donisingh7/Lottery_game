-- Run this in your Supabase SQL Editor
CREATE TABLE lottery_cards (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  token          TEXT        UNIQUE NOT NULL,
  username       TEXT        NOT NULL,
  lottery_number TEXT        NOT NULL,
  is_scratched   BOOLEAN     DEFAULT FALSE NOT NULL,
  scratched_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
