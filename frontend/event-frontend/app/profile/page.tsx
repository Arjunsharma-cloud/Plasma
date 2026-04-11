"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, GraduationCap, Edit2, Save, X, Calendar, Trophy, Users, Activity, ChevronRight, Shield } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans">
        <Activity className="w-6 h-6 animate-pulse mr-2" /> Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <div className="flex items-center space-x-2 text-sm font-medium text-slate-500">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Authenticated Session</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        
        {/* Profile Details Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-blue-600 uppercase">
                  {profile.first_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {profile.first_name || "User"} {profile.last_name}
                </h1>
                <p className="text-slate-500 flex items-center mt-1 text-sm">
                  <Mail className="w-4 h-4 mr-1.5" />
                  {user?.email}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                isEditing 
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
              }`}
            >
              {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
              {isEditing ? "Cancel Edit" : "Edit Details"}
            </button>
          </div>

          <div className="p-8">
            {!isEditing ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl flex items-start space-x-4">
                  <div className="p-2 bg-white text-slate-400 rounded-lg shadow-sm border border-slate-100">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone Number</p>
                    <p className="text-sm font-medium text-slate-900">{profile.phone || "Not configured"}</p>
                  </div>
                </div>
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl flex items-start space-x-4">
                  <div className="p-2 bg-white text-slate-400 rounded-lg shadow-sm border border-slate-100">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Institution</p>
                    <p className="text-sm font-medium text-slate-900">{profile.college || "Not configured"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5 bg-slate-50 p-6 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none text-sm"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">College</label>
                  <input
                    type="text"
                    value={profile.college}
                    onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none text-sm"
                    placeholder="University Name"
                  />
                </div>
                <div className="md:col-span-2 pt-4 flex justify-end">
                  <button
                    onClick={handleUpdateProfile}
                    className="flex items-center px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Events</p>
                <p className="text-3xl font-extrabold text-slate-900">{registeredEvents.length}</p>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Teams</p>
                <p className="text-3xl font-extrabold text-slate-900">
                  {registeredEvents.filter(e => e.team_name).length}
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600 border border-slate-100">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Member Since</p>
                <p className="text-3xl font-extrabold text-slate-900">
                  {new Date().getFullYear()}
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600 border border-slate-100">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Event Roster Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900">Event Roster</h2>
            <Link href="/events" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Browse Directory &rarr;
            </Link>
          </div>
          
          {registeredEvents.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 mb-6 font-medium">No active registrations found.</p>
              <Link
                href="/events"
                className="inline-flex items-center px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
              >
                View Available Events
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {registeredEvents.map((event, index) => (
                <div key={index} className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                  <div className="flex-1">
                    <div className="flex items-center mb-1.5 gap-3">
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-md uppercase tracking-wider">
                        Confirmed
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {new Date(event.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      {event.event_title}
                    </h3>
                    <div className="flex items-center text-sm text-slate-500">
                      <Users className="w-4 h-4 mr-1.5" />
                      {event.team_name || "Individual Entry"}
                    </div>
                  </div>
                  
                  <Link
                    href={`/events/${event.event_id}`}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium border border-slate-200 bg-white text-slate-700 rounded-lg hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4 ml-1 text-slate-400" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}