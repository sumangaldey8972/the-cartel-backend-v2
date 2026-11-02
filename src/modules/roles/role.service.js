import { DEFAULT_ROLE_CODE, SYSTEM_ROLE_DEFINITIONS } from "./role.constants.js";
import { Role } from "./role.model.js";

function definitionFor(code) {
  return SYSTEM_ROLE_DEFINITIONS.find((role) => role.code === code);
}

export function roleCodes(roles = []) {
  return [...new Set(
    roles
      .map((role) => (typeof role === "string" ? role : role?.code))
      .filter(Boolean),
  )];
}

export async function getDefaultRole() {
  const definition = definitionFor(DEFAULT_ROLE_CODE);
  return Role.findOneAndUpdate(
    { code: DEFAULT_ROLE_CODE },
    { $setOnInsert: { ...definition, isSystem: true, isActive: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function seedSystemRoles() {
  const collection = Role.db.collection(Role.collection.name);

  await collection.bulkWrite(
    SYSTEM_ROLE_DEFINITIONS.map((definition) => ({
      updateOne: {
        filter: { code: definition.code },
        update: {
          $setOnInsert: {
            ...definition,
            isSystem: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        upsert: true,
      },
    })),
    { ordered: false },
  );

  await Promise.all([
    collection.createIndex({ code: 1 }, { unique: true, name: "code_1" }),
    collection.createIndex({ isActive: 1 }, { name: "isActive_1" }),
  ]);

  return collection
    .find({ code: { $in: SYSTEM_ROLE_DEFINITIONS.map((role) => role.code) } })
    .toArray();
}
