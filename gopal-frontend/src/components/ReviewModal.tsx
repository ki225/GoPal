import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import UserSidebar from "./UserSidebar";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name: string;
  reviewer_id: string; 
}

interface ReviewModalProps {
  location: { id: string; name: string };
  token: string;
  onClose: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ location, token, onClose }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const currentUserId = localStorage.getItem("userId") || "";

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
  };

  const closeSidebar = () => {
    setSelectedUserId(null);
  };

  const loadReviews = async () => {
    try {
      const res = await axiosInstance.get(`/location_reviews/checkin/${location.id}`);
      setReviews(res.data);
    } catch (err) {
      alert("載入評論失敗，請稍後再試");
    }
  };

  const submitReview = async () => {
    if (!newComment.trim()) return alert("請填寫評論內容");
    setIsSubmitting(true);

    const payload = {
      checkin_id: String(location.id),
      rating: newRating,
      comment: newComment,
    };

    try {
      console.log(payload);
      await axiosInstance.post("/location_reviews", payload);
      setNewComment("");
      setNewRating(5);
      await loadReviews();
    } catch (error: any) {
      const msg = error.response?.data?.detail || "評論送出失敗，請稍後再試";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [location.id]);

  useEffect(() => {
  console.log("被點擊的 userId:", selectedUserId);
}, [selectedUserId]);

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{location.name} 的評論</h2>
        <button onClick={onClose} style={{ float: "right" }}>
          關閉
        </button>

        <div style={{ marginBottom: "1rem" }}>
          <h4>新增評論：</h4>
          <select value={newRating} onChange={(e) => setNewRating(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} 星
              </option>
            ))}
          </select>
          <br />
          <textarea
            rows={3}
            style={{ width: "100%" }}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="輸入你的評論"
          />
          <button onClick={submitReview} disabled={isSubmitting}>
            {isSubmitting ? "送出中..." : "送出"}
          </button>
        </div>

        <div>
          <h4>所有評論：</h4>
          {reviews.length === 0 ? (
            <p>目前還沒有評論</p>
          ) : (
            <ul>
              {reviews.map((r) => (
                <li key={r.id}>
                  <strong
                    style={{ color: "blue", cursor: "pointer" }}
                    onClick={() => handleUserClick(r.reviewer_id)}
                  >
                    {r.reviewer_name}
                  </strong>{" "}
                  ({r.rating} 星):<br />
                  {r.comment}
                  <br />
                  <small>{new Date(r.created_at).toLocaleString()}</small>
                  <hr />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {selectedUserId && (
        <UserSidebar
          userId={selectedUserId}
          currentUserId={currentUserId}
          onClose={closeSidebar}
        />
      )}
    </div>
  );
};

export default ReviewModal;
