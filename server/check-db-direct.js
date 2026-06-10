/**
 * Direct Database Check
 * 
 * Bypasses all caching and reads directly from MongoDB
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      readPreference: 'primary',
    });
    console.log('✅ Connected to MongoDB\n');

    // Get raw collection (bypass Mongoose models)
    const db = mongoose.connection.db;
    const applicationsCollection = db.collection('applications');

    const now = new Date();
    const apps = await applicationsCollection.find({
      deadline: { $gte: now },
      status: { $nin: ['rejected', 'withdrawn', 'offer'] },
    }).toArray();

    console.log(`Found ${apps.length} applications:\n`);

    for (const app of apps) {
      const hoursUntil = (new Date(app.deadline) - now) / (1000 * 60 * 60);
      console.log(`📋 ${app.company} - ${app.role}`);
      console.log(`   _id: ${app._id}`);
      console.log(`   Hours until: ${hoursUntil.toFixed(1)}h`);
      console.log(`   reminder24hSent: ${app.reminder24hSent}`);
      console.log(`   reminder12hSent: ${app.reminder12hSent}`);
      console.log('');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
