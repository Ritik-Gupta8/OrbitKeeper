import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Ensure we always read from primary replica to avoid replication lag
      readPreference: 'primary',
      // Ensure writes are acknowledged by majority of replicas
      writeConcern: {
        w: 'majority',
        wtimeout: 5000,
      },
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    console.log(`🔒 Read preference: primary | Write concern: majority`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};
