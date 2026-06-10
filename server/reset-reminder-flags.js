/**
 * Reset Reminder Flags Script
 * 
 * This script resets reminder24hSent and reminder12hSent flags on all applications
 * so the deadline monitor can send reminders again.
 * 
 * Usage: node reset-reminder-flags.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function resetReminderFlags() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      readPreference: 'primary',
      writeConcern: {
        w: 'majority',
        wtimeout: 5000,
      },
    });
    console.log('✅ Connected to MongoDB');

    // Use raw MongoDB driver to bypass any Mongoose middleware
    const db = mongoose.connection.db;
    const applicationsCollection = db.collection('applications');

    // Find all applications with upcoming deadlines
    const now = new Date();
    const apps = await applicationsCollection.find({
      deadline: { $gte: now },
      status: { $nin: ['rejected', 'withdrawn', 'offer'] },
    }).toArray();

    console.log(`\nFound ${apps.length} applications with upcoming deadlines:`);
    
    for (const app of apps) {
      const hoursUntil = (new Date(app.deadline) - now) / (1000 * 60 * 60);
      console.log(`\n📋 ${app.company} - ${app.role}`);
      console.log(`   Deadline: ${new Date(app.deadline).toLocaleString()}`);
      console.log(`   Hours until: ${hoursUntil.toFixed(1)}h`);
      console.log(`   reminder24hSent: ${app.reminder24hSent}`);
      console.log(`   reminder12hSent: ${app.reminder12hSent}`);
    }

    console.log('\n🔄 Resetting flags...');

    // Reset reminder flags using raw MongoDB driver with explicit write concern
    const result = await applicationsCollection.updateMany(
      { deadline: { $gte: now } },
      { 
        $set: { 
          reminder24hSent: false, 
          reminder12hSent: false 
        } 
      },
      {
        writeConcern: { w: 'majority', wtimeout: 10000 }
      }
    );

    console.log(`✅ Modified ${result.modifiedCount} documents`);
    console.log(`   Matched: ${result.matchedCount}`);
    console.log(`   Acknowledged: ${result.acknowledged}`);
    
    // Wait for write to propagate
    console.log('\n⏳ Waiting 2 seconds for replication...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify the reset worked
    console.log('🔍 Verifying reset...\n');
    
    const verifyApps = await applicationsCollection.find({
      deadline: { $gte: now },
      status: { $nin: ['rejected', 'withdrawn', 'offer'] },
    }).toArray();
    
    for (const app of verifyApps) {
      console.log(`   ${app.company}: 24h=${app.reminder24hSent}, 12h=${app.reminder12hSent}`);
    }
    
    console.log('\n✅ Verification complete. Now restart your server with: rs');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

resetReminderFlags();
