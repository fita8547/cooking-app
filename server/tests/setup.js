import mongoose from 'mongoose';
import { beforeAll, afterAll, afterEach } from 'vitest';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use test database
const TEST_DB_URI = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || 'mongodb://localhost:27017/adhoc-cooking-test';

beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(TEST_DB_URI);
});

afterEach(async () => {
  // Clean up collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  // Disconnect from database
  await mongoose.disconnect();
});
