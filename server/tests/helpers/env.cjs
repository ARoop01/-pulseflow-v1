// Runs before each test file via Jest setupFiles — sets env vars before any ESM module loads
process.env.DATABASE_URL = 'file:./prisma/test.db';
process.env.JWT_SECRET = 'test_jwt_secret_not_for_production';
process.env.NODE_ENV = 'test';
