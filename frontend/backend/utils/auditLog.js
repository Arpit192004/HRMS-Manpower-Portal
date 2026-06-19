const ChangeLog = require("../models/ChangeLog");

const createAuditLog = async ({
  client,
  entityType,
  entityId,
  action,
  oldData = {},
  newData = {},
  updatedBy
}) => {
  const changes = [];

  const fields = new Set([
    ...Object.keys(oldData),
    ...Object.keys(newData)
  ]);

  fields.forEach((field) => {
    if (["_id", "__v", "createdAt", "updatedAt"].includes(field)) return;

    const oldValue = oldData[field];
    const newValue = newData[field];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({ field, oldValue, newValue });
    }
  });

  return ChangeLog.create({
    client: client || null,
    entityType,
    entityId,
    action,
    changes,
    updatedBy
  });
};

module.exports = createAuditLog;