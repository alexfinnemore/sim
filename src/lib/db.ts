import { neon } from '@neondatabase/serverless';

// Create a SQL query function using the DATABASE_URL
export const sql = neon(process.env.DATABASE_URL!);

// Helper for transactions (Neon serverless doesn't support traditional transactions,
// but we can use this pattern for multiple queries)
export async function query<T>(queryText: string, params?: unknown[]): Promise<T[]> {
  const result = await sql(queryText, params);
  return result as T[];
}

// Type-safe query helpers
export const db = {
  // Raw SQL execution
  sql,
  query,

  // Convenience methods
  async findOne<T>(queryText: string, params?: unknown[]): Promise<T | null> {
    const results = await query<T>(queryText, params);
    return results[0] ?? null;
  },

  async findMany<T>(queryText: string, params?: unknown[]): Promise<T[]> {
    return query<T>(queryText, params);
  },

  async execute(queryText: string, params?: unknown[]): Promise<void> {
    await sql(queryText, params);
  },
};
