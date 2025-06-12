import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import MapView from "../components/MapView";

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

  if (!user) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-6">
        <img
          src={user.avatar_url}
          alt="Avatar"
          className="w-24 h-24 rounded-full object-cover"
        />
        <div>
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className="text-gray-600">{user.bio || "No bio available."}</p>
          <button
            onClick={handleEditProfile}
            className="mt-2 px-4 py-1 bg-blue-500 text-white rounded"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-2">Your Check-in Map</h2>
      <MapView token={token} />

      <h2 className="text-xl font-bold mt-8 mb-2">Friends</h2>
      <div className="flex flex-wrap gap-4">
        {friends.map((friend) => (
          <div key={friend.id} className="w-32 text-center">
            <img
              src={friend.avatar_url}
              alt={friend.name}
              className="w-16 h-16 rounded-full mx-auto"
            />
            <p className="text-sm mt-1">{friend.name}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold mt-8 mb-2">Your Check-in Posts</h2>
      <div className="space-y-4">
        {checkinPosts.map((post) => (
          <div
            key={post.id}
            className="border p-4 rounded shadow bg-white"
          >
            <h3 className="font-semibold">📍 {post.location_name}</h3>
            <p className="text-sm text-gray-500">{new Date(post.timestamp).toLocaleString()}</p>
            {post.comment && <p className="mt-2">{post.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserPage;
