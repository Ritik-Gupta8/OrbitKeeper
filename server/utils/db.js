import mongoose from 'mongoose';

export const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is missing!');
    return false;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      readPreference: 'primary',
      writeConcern: {
        w: 'majority',
        wtimeout: 5000,
      },
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    console.log(`🔒 Read preference: primary | Write concern: majority`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};
