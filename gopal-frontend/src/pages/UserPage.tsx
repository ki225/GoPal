import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import MapView from "../components/MapView";
import "./UserPage.css"; 

interface UserProfileProps {
  userId: string;
  token: string;
}

interface UserProfile {
  userId: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  travel_preferences?: string;
  token: string;
}

interface Friend {
  id: string;
  name: string;
  avatar_url?: string;
}

interface CheckinPost {
  id: string;
  location_name: string;
  timestamp: string;
  comment?: string;
  lat: number;
  lng: number;
}

const UserPage: React.FC<UserProfileProps> = ({ token, userId }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [checkinPosts, setCheckinPosts] = useState<CheckinPost[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const userRes = await axiosInstance.get(`users/${userId}`);
      setUser(userRes.data);

      const friendsRes = await axiosInstance.get(`/users/${userId}/friends`);
      setFriends(friendsRes.data);

      const checkinsRes = await axiosInstance.get(`/users/${userId}/checkins`);
      setCheckinPosts(checkinsRes.data);
    };

    fetchUserData();
  }, []);

  const handleEditProfile = () => {
    // Open modal or navigate to edit page
    alert("Profile edit not yet implemented.");
  };

  if (!user) return <div className="loading">Loading</div>;

  return (
    <div className="user-page">
      <div className="user-page-container">
        <div className="profile-header">
          <img
            src={user.avatar_url || '/default-avatar.png'}
            alt="Avatar"
            className="profile-avatar"
          />
          <div className="profile-info">
            <h1 className="profile-name">{user.name}</h1>
            <p className="profile-bio">{user.bio || "No bio available."}</p>
            <button
              onClick={handleEditProfile}
              className="edit-profile-btn"
            >
              Edit Profile
            </button>
          </div>
        </div>

        <h2 className="section-header">Your Check-in Map</h2>
        <div className="map-container">
          <MapView token={token} checkins={checkinPosts} />
        </div>

        <h2 className="section-header">Friends</h2>
        <div className="friends-grid">
          {friends.map((friend) => (
            <div key={friend.id} className="friend-card">
              <img
                src={friend.avatar_url || '/default-avatar.png'}
                alt={friend.name}
                className="friend-avatar"
              />
              <p className="friend-name">{friend.name}</p>
            </div>
          ))}
        </div>

        <h2 className="section-header">Your Check-in Posts</h2>
        <div className="checkin-posts">
          {checkinPosts.map((post) => (
            <div key={post.id} className="checkin-post">
              <h3 className="checkin-location">{post.location_name}</h3>
              <p className="checkin-timestamp">
                {new Date(post.timestamp).toLocaleString()}
              </p>
              {post.comment && (
                <p className="checkin-comment">{post.comment}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserPage;