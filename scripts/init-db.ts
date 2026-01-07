import { neon } from '@neondatabase/serverless';

async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL not set. Run: source .env.local');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log('Creating tables...');

  // Run each statement individually using tagged templates
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✓ users table');

    // Simulations table
    await sql`
      CREATE TABLE IF NOT EXISTS simulations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        turn_number INTEGER DEFAULT 0,
        config JSONB NOT NULL DEFAULT '{}',
        population_seed INTEGER,
        state VARCHAR(50) DEFAULT 'setup',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✓ simulations table');

    // Characters table
    await sql`
      CREATE TABLE IF NOT EXISTS characters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        attributes JSONB NOT NULL DEFAULT '{}',
        strategy VARCHAR(50) NOT NULL,
        state JSONB NOT NULL DEFAULT '{}',
        is_player BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✓ characters table');

    // Relationships table
    await sql`
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
      )
    `;
    console.log('✓ relationships table');

    // Events table
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
        turn INTEGER NOT NULL,
        type VARCHAR(100) NOT NULL,
        description TEXT,
        character_ids UUID[] DEFAULT '{}',
        data JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✓ events table');

    // Player characters table
    await sql`
      CREATE TABLE IF NOT EXISTS player_characters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
        simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, simulation_id)
      )
    `;
    console.log('✓ player_characters table');

    // Player actions table
    await sql`
      CREATE TABLE IF NOT EXISTS player_actions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
        turn INTEGER NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        target_id UUID REFERENCES characters(id) ON DELETE CASCADE,
        data JSONB DEFAULT '{}',
        executed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✓ player_actions table');

    // Indexes
    console.log('Creating indexes...');

    await sql`CREATE INDEX IF NOT EXISTS idx_characters_simulation ON characters(simulation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_relationships_simulation ON relationships(simulation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_relationships_chars ON relationships(char_a_id, char_b_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_events_simulation_turn ON events(simulation_id, turn)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_player_actions_simulation ON player_actions(simulation_id, turn)`;
    console.log('✓ indexes created');

    console.log('\n✓ Database initialization complete!');
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

initDatabase();
