"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Calendar, Trophy, MapPin, Users, Sparkles } from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchEvents();
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      fetchUserProfile(userData.user_id);
    }
    loadRegisteredEvents();
  }, []);

  const fetchUserProfile = async (userId: number) => {
    try {
      const res = await fetch(`http://localhost:8082/api/auth/profile/${userId}`);
      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.log("Profile fetch failed");
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:8083/api/events");
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      setEvents([
        {
          event_id: 1,
          title: "National Hackathon 2024",
          description: "Build innovative solutions for real-world problems",
          event_date: "2024-12-15T10:00:00Z",
          location: "Convention Center, Hall A",
          prize: "$10,000",
          event_type: "hackathon",
          capacity: 100,
          min_team_size: 1,
          max_team_size: 4,
          host_name: "Tech Events Org",
        },
        {
          event_id: 2,
          title: "AI Workshop 2024",
          description: "Learn about artificial intelligence from industry experts",
          event_date: "2024-11-25T14:00:00Z",
          location: "Virtual Conference",
          prize: "Certificate",
          event_type: "workshop",
          capacity: 200,
          min_team_size: 1,
          max_team_size: 1,
          host_name: "AI Foundation",
        },
      ]);
    }
  };

  const loadRegisteredEvents = () => {
    const saved = localStorage.getItem("registeredEvents");
    if (saved) {
      setRegisteredEvents(JSON.parse(saved));
    }
  };

  const getDisplayName = () => {
    if (user?.first_name) return user.first_name;
    if (user?.email) return user.email.split('@')[0];
    return "Guest";
  };

  const filteredEvents = events.filter(
    (event) =>
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.event_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topEvents = [...events].slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Hero Section - Light Blue Gradient */}
      <div className="bg-gradient-to-r from-blue-400 to-indigo-300 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {user ? `Welcome back, ${getDisplayName()}! ` : "Discover Amazing Events"}
          </h1>
          <p className="text-lg md:text-xl mb-8 text-blue-100">
            {user ? "Ready for your next adventure?" : "Join hackathons, workshops, and competitions near you"}
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search events by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl text-white-800 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg"
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Stats Section */}
        {user && (
          <div className="mb-12">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Events Participated</p>
                    <p className="text-3xl font-bold text-blue-300">{registeredEvents.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-blue-300" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Active Teams</p>
                    <p className="text-3xl font-bold text-indigo-300">
                      {registeredEvents.filter(r => r.team_name).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-indigo-300" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Available Events</p>
                    <p className="text-3xl font-bold text-green-600">{events.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Events Section */}
        {topEvents.length > 0 && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                Top Picks For You
              </h2>
              <Link href="/events" className="text-blue-300 hover:text-blue-400 font-medium">View all →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {topEvents.map((event) => (
                <div key={event.event_id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="relative h-40 bg-gradient-to-r from-blue-400 to-indigo-300 flex items-center justify-center">
                    <span className="text-5xl">🎯</span>
                    <span className="absolute top-3 right-3 px-2 py-1 bg-white/90 rounded-lg text-xs font-semibold text-gray-700">
                      {event.event_type}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(event.event_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-gray-500">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.location}
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Trophy className="w-4 h-4 mr-2" />
                        {event.prize}
                      </div>
                    </div>
                    <Link
                      href={`/events/${event.event_id}`}
                      className="mt-4 block text-center px-4 py-2 bg-gradient-to-r from-blue-300 to-indigo-100 text-white rounded-lg hover:opacity-90 transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Events Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">📅 All Events</h2>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-md">
              <p className="text-gray-500">No events found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div key={event.event_id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {event.event_type}
                      </span>
                      <Users className="w-4 h-4 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                    <div className="space-y-1 text-sm border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date:</span>
                        <span className="font-medium text-gray-700">{new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Venue:</span>
                        <span className="font-medium text-gray-700 truncate max-w-[150px]">{event.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Prize:</span>
                        <span className="font-medium text-green-600">{event.prize}</span>
                      </div>
                    </div>
                    <Link
                      href={`/events/${event.event_id}`}
                      className="mt-4 block text-center px-3 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}