/**
 * Database Migration Script: Add Indexes
 * 
 * This script adds indexes to existing collections for the
 * Ingredient-Health Recipe Recommendation feature.
 * 
 * Run with: node server/scripts/migrate-indexes.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cooking-app';

async function migrateIndexes() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Add indexes to recipes collection
    console.log('\n📊 Adding indexes to recipes collection...');
    const recipesCollection = db.collection('recipes');
    
    await recipesCollection.createIndex({ allergens: 1 });
    console.log('  ✓ Created index on allergens');
    
    await recipesCollection.createIndex({ 'nutrition.calories': 1 });
    console.log('  ✓ Created index on nutrition.calories');
    
    await recipesCollection.createIndex({ tags: 1 });
    console.log('  ✓ Created index on tags');

    // Add indexes to healthinformations collection
    console.log('\n📊 Adding indexes to healthinformations collection...');
    const healthInfoCollection = db.collection('healthinformations');
    
    await healthInfoCollection.createIndex({ userId: 1 }, { unique: true });
    console.log('  ✓ Created unique index on userId');
    
    await healthInfoCollection.createIndex({ updatedAt: -1 });
    console.log('  ✓ Created index on updatedAt');

    // Add indexes to meals collection
    console.log('\n📊 Adding indexes to meals collection...');
    const mealsCollection = db.collection('meals');
    
    await mealsCollection.createIndex({ userId: 1, date: -1 });
    console.log('  ✓ Created compound index on userId and date');
    
    await mealsCollection.createIndex({ updatedAt: -1 });
    console.log('  ✓ Created index on updatedAt');

    console.log('\n✅ All indexes created successfully!');
    console.log('\n📋 Index Summary:');
    console.log('  Recipes: allergens, nutrition.calories, tags');
    console.log('  HealthInformations: userId (unique), updatedAt');
    console.log('  Meals: userId+date (compound), updatedAt');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration
migrateIndexes();
