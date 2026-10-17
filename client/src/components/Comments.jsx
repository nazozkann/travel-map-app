import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import formatDate from "../utils/formatDate";

// Comment thread with a composer. `onAdd(text)` resolves to true when the comment was saved.
export default function Comments({ comments, username, onAdd, onDelete, placeholder }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    if (await onAdd(text)) setText("");
    setSending(false);
  }

  return (
    <section className="section">
      <h2 className="section-title">
        Comments {comments.length > 0 && <span className="count">{comments.length}</span>}
      </h2>

      {username ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <textarea
            className="input"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            maxLength={1000}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? "Posting..." : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="muted">
          <Link to="/auth" className="link">
            Log in
          </Link>{" "}
          to leave a comment.
        </p>
      )}

      {comments.length > 0 && (
        <ul className="comment-list">
          {comments.map((comment, index) => (
            <li key={comment._id ?? index} className="comment">
              <span className="avatar avatar-sm" aria-hidden="true">
                {comment.username?.[0]?.toUpperCase()}
              </span>
              <div className="comment-main">
                <div className="comment-header">
                  <Link
                    to={`/profile/${encodeURIComponent(comment.username)}`}
                    className="comment-author"
                  >
                    {comment.username}
                  </Link>
                  <span className="muted small">{formatDate(comment.createdAt)}</span>
                  {username === comment.username && (
                    <button
                      type="button"
                      className="icon-btn icon-btn-sm comment-delete"
                      aria-label="Delete comment"
                      onClick={() => onDelete(comment._id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
