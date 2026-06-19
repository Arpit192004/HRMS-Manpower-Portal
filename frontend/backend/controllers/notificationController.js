const Notification = require("../models/Notification");

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { user: req.user._id },
        { audienceRoles: req.user.role }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const mapped = notifications.map((notification) => ({
      ...notification.toObject(),
      isRead: notification.readBy.some(
        (userId) => userId.toString() === req.user._id.toString()
      )
    }));

    res.json({
      success: true,
      count: mapped.length,
      unreadCount: mapped.filter((notification) => !notification.isRead).length,
      notifications: mapped
    });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.status(404);
      throw new Error("Notification not found");
    }

    if (!notification.readBy.some((userId) => userId.toString() === req.user._id.toString())) {
      notification.readBy.push(req.user._id);
      await notification.save();
    }

    res.json({
      success: true,
      message: "Notification marked as read"
    });
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        $or: [
          { user: req.user._id },
          { audienceRoles: req.user.role }
        ],
        readBy: { $ne: req.user._id }
      },
      { $push: { readBy: req.user._id } }
    );

    res.json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
