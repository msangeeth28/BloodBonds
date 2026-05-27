/**
 * Run once to create the admin account:
 *   node createAdmin.js
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ role: "admin" });
  if (existing) {
    console.log("Admin already exists:", existing.email);
    process.exit(0);
  }

  const password = await bcrypt.hash("Admin@1234", 10);
  await User.create({
    name: "Admin",
    email: "admin@bloodbonds.com",
    mobile: "9999999999",
    password,
    role: "admin",
    city: "Hyderabad",
    subLocation: "Gachibowli",
    isVerified: true,
  });

  console.log("\n✅ Admin created!");
  console.log("   Email:    admin@bloodbonds.com");
  console.log("   Password: Admin@1234\n");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
