"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, GraduationCap, Edit2, Save, X, Calendar, Trophy, Users, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    college: "",
  });
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(savedUser);
    setUser(userData);
    fetchProfile(userData.user_id);
    loadRegisteredEvents();
  }, []);

  const fetchProfile = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:8082/api/auth/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          college: data.college || "",
        });
        
        // Update user in localStorage with fresh data
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.log("Using cached profile data");
    } finally {
      setLoading(false);
    }
  };

  const loadRegisteredEvents = () => {
    const saved = localStorage.getItem("registeredEvents");
    if (saved) {
      setRegisteredEvents(JSON.parse(saved));
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8082/api/auth/profile/${user.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        const updatedUser = { ...user, ...profile };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        toast.success("Profile updated successfully!");
        setIsEditing(false);
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      // Demo update
      const updatedUser = { ...user, ...profile };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Profile updated successfully! (Demo Mode)");
      setIsEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
            <div className="absolute -bottom-12 left-8">
              <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {profile.first_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-16 pb-8 px-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {profile.first_name} {profile.last_name}
                </h1>
                <p className="text-gray-500 flex items-center mt-1">
                  <Mail className="w-4 h-4 mr-1" />
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
              >
                {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            {/* Profile Info Display */}
            {!isEditing ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="text-gray-800 font-medium">{profile.phone || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                  <GraduationCap className="w-5 h-5 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">College/University</p>
                    <p className="text-gray-800 font-medium">{profile.college || "Not set"}</p>
                  </div>
                </div>
              </div>
            ) : (
              // Edit Mode
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                  <input
                    type="text"
                    value={profile.college}
                    onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="MIT University"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end mt-2">
                  <button
                    onClick={handleUpdateProfile}
                    className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Events Participated</p>
                <p className="text-3xl font-bold text-blue-600">{registeredEvents.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Teams</p>
                <p className="text-3xl font-bold text-purple-600">
                  {registeredEvents.filter(e => e.team_name).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Member Since</p>
                <p className="text-3xl font-bold text-green-600">
                  {new Date().getFullYear()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Registered Events Section */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              My Registered Events
            </h2>
          </div>
          
          {registeredEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">You haven't registered for any events yet</p>
              <Link
                href="/events"
                className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition"
              >
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {registeredEvents.map((event, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full mr-2">
                          Registered
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(event.registered_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {event.event_title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-1" />
                        Team: {event.team_name || "Individual Participant"}
                      </div>
                    </div>
                    <Link
                      href={`/events/${event.event_id}`}
                      className="px-4 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                    >
                      View Event
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}