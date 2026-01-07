-- Relationship Simulator Database Schema
-- Run this against your Neon database to create the tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simulations table
CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  turn_number INTEGER DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}',
  population_seed INTEGER,
  state VARCHAR(50) DEFAULT 'setup',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}',
  strategy VARCHAR(50) NOT NULL,
  state JSONB NOT NULL DEFAULT '{}',
  is_player BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relationships table (edges in the social graph)
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  char_a_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  char_b_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  type VARCHAR(50) DEFAULT 'none',
  strength DECIMAL(5,2) DEFAULT 0,
  trust DECIMAL(5,2) DEFAULT 50,
  investment DECIMAL(5,2) DEFAULT 0,
  history JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(char_a_id, char_b_id)
);

-- Events table (simulation history)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  turn INTEGER NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  character_ids UUID[] DEFAULT '{}',
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player characters (links users to their characters across simulations)
CREATE TABLE IF NOT EXISTS player_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, simulation_id)
);

-- Player actions (queued actions for each turn)
CREATE TABLE IF NOT EXISTS player_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  turn INTEGER NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  target_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  executed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_characters_simulation ON characters(simulation_id);
CREATE INDEX IF NOT EXISTS idx_relationships_simulation ON relationships(simulation_id);
CREATE INDEX IF NOT EXISTS idx_relationships_chars ON relationships(char_a_id, char_b_id);
CREATE INDEX IF NOT EXISTS idx_events_simulation_turn ON events(simulation_id, turn);
CREATE INDEX IF NOT EXISTS idx_player_actions_simulation ON player_actions(simulation_id, turn);
