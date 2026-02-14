import 'dotenv/config'
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: 'prisma/schema.prisma',        // Where your schema is
  datasource: {
    url: env('DATABASE_URL'),             // Your database connection
  },
});