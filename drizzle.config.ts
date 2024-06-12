import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/modules/**/*.model.ts',
    out: './src/db/migrations/',
    dialect: 'sqlite',
    dbCredentials: {
        url: './sqlite.db',
    },
    verbose: true,
    strict: true,
});
