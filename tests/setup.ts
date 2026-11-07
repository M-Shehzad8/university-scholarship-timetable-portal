import { config as loadEnv } from "dotenv";

// Integration tests use the same local database configuration as the app.
// Unit tests do not need a database and are unaffected by these values.
loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });
