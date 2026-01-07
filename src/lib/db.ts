import { neon, NeonQueryFunction } from '@neondatabase/serverless';

// Create a SQL tagged template function using the DATABASE_URL
// Usage: await sql`SELECT * FROM users WHERE id = ${userId}`
export const sql: NeonQueryFunction<false, false> = neon(process.env.DATABASE_URL!);

// Re-export for convenience
export { sql as db };
