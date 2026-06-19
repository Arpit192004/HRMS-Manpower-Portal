const Notification = require("../models/Notification");

const createNotification = async ({
  title,
  message,
  type = "Info",
  link = "",
  audienceRoles = ["Super Admin"],
  user = null,
  entityType = "",
  entityId = null
}) => {
  return Notification.create({
    title,
    message,
    type,
    link,
    audienceRoles,
    user,
    entityType,
    entityId
  });
};

module.exports = createNotification;
