import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { env } from "../src/config/env.js";
import { DEFAULT_ROLE_CODE } from "../src/modules/roles/role.constants.js";
import { seedSystemRoles } from "../src/modules/roles/role.service.js";
import { User } from "../src/modules/users/user.model.js";

const BATCH_SIZE = 500;
const applyChanges = process.argv.includes("--apply");

function uniqueObjectIds(values) {
  return [...new Map(values.map((value) => [value.toString(), value])).values()];
}

async function migrateUserRoles() {
  if (!env.mongoUrl) throw new Error("MONGO_URL is required");
  await connectDatabase();

  const users = mongoose.connection.collection(User.collection.name);
  const cursor = users.find({}, { projection: { roles: 1 } });

  if (!applyChanges) {
    let usersToUpdate = 0;
    for await (const user of cursor) {
      const roles = Array.isArray(user.roles) ? user.roles : [];
      if (roles.length === 0 || roles.some((role) => !(role instanceof mongoose.Types.ObjectId))) {
        usersToUpdate += 1;
      }
    }
    console.info(`Role migration dry run: would seed 6 system roles and update ${usersToUpdate} users`);
    console.info("Run npm run migrate:roles:apply after confirming a database backup to apply these changes");
    return;
  }

  const roles = await seedSystemRoles();
  const rolesByCode = new Map(roles.map((role) => [role.code, role._id]));
  const defaultRoleId = rolesByCode.get(DEFAULT_ROLE_CODE);

  let migratedUsers = 0;
  let operations = [];

  async function flush() {
    if (operations.length === 0) return;
    await users.bulkWrite(operations, { ordered: false });
    operations = [];
  }

  for await (const user of cursor) {
    const currentRoles = Array.isArray(user.roles) ? user.roles : [];
    const mappedRoles = currentRoles.map((role) => {
      if (role instanceof mongoose.Types.ObjectId) return role;
      if (typeof role === "string" && rolesByCode.has(role.toUpperCase())) {
        return rolesByCode.get(role.toUpperCase());
      }
      if (mongoose.isObjectIdOrHexString(role)) return new mongoose.Types.ObjectId(role);
      return defaultRoleId;
    });
    const nextRoles = uniqueObjectIds(mappedRoles.length > 0 ? mappedRoles : [defaultRoleId]);
    const changed = currentRoles.length !== nextRoles.length
      || currentRoles.some((role, index) => role.toString() !== nextRoles[index].toString());

    if (!changed) continue;
    operations.push({
      updateOne: {
        filter: { _id: user._id },
        update: { $set: { roles: nextRoles } },
      },
    });
    migratedUsers += 1;
    if (operations.length >= BATCH_SIZE) await flush();
  }

  await flush();
  console.info(`Role migration applied: ${roles.length} roles seeded, ${migratedUsers} users updated`);
}

try {
  await migrateUserRoles();
} catch (error) {
  console.error("Role migration failed", error);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
