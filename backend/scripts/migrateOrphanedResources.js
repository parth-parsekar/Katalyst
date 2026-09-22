/**
 * One-time migration script.
 * Assigns all resources that have no userId to a specified Google user ID.
 *
 * Usage:
 *   node scripts/migrateOrphanedResources.js <your-google-id>
 *
 * Your Google ID (sub) can be found by hitting GET /api/auth/me while logged in.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Resource = require("../models/Resource");

const targetUserId = process.argv[2];

if (!targetUserId) {
  console.error("Usage: node scripts/migrateOrphanedResources.js <google-user-id>");
  process.exit(1);
}

(async () => {
  await connectDB();
  const result = await Resource.updateMany(
    { userId: { $exists: false } },
    { $set: { userId: targetUserId } }
  );
  console.log(`Migrated ${result.modifiedCount} orphaned resources to userId: ${targetUserId}`);
  await mongoose.disconnect();
})();
