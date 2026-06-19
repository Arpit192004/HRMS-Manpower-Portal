import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAllRead = async () => {
    setError("");
    setSuccess("");

    try {
      await api.patch("/notifications/read-all");
      setSuccess("All notifications marked as read");
      await loadNotifications();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update notifications");
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Notifications</h1>
          <p>Track leads, approvals, hiring and system updates.</p>
        </div>
        <button className="secondary-button" onClick={markAllRead}>Mark all read</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {loading ? (
        <div className="content-card">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state content-card">
          <h3>No notifications</h3>
          <p>Important updates will appear here.</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <article
              className={`content-card notification-card ${notification.isRead ? "" : "unread"}`}
              key={notification._id}
            >
              <div>
                <span className={`status-pill ${notification.type.toLowerCase()}`}>
                  {notification.type}
                </span>
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <small>{new Date(notification.createdAt).toLocaleString()}</small>
              </div>
              {notification.link && (
                <Link className="mini-link" to={notification.link}>Open</Link>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Notifications;
