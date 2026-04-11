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
        {
  event_id: 3,
  title: "Blockchain Revolution Summit",
  description: "Explore the future of decentralized technology and Web3 applications",
  event_date: "2025-01-20T09:00:00Z",
  location: "Tech Hub, San Francisco",
  prize: "Networking & Grants",
  event_type: "conference",
  capacity: 300,
  min_team_size: 1,
  max_team_size: 1,
  host_name: "Blockchain Alliance",
},
{
  event_id: 4,
  title: "Data Science Hackathon",
  description: "Solve real-world problems using machine learning and big data",
  event_date: "2024-12-05T10:00:00Z",
  location: "Online",
  prize: "$5,000 + Internship Offers",
  event_type: "hackathon",
  capacity: 500,
  min_team_size: 2,
  max_team_size: 5,
  host_name: "Kaggle Community",
},
{
  event_id: 5,
  title: "UI/UX Design Workshop",
  description: "Hands-on session on Figma, user research, and prototyping",
  event_date: "2024-11-30T13:00:00Z",
  location: "Design Studio, New York",
  prize: "Design Kit & Certificate",
  event_type: "workshop",
  capacity: 50,
  min_team_size: 1,
  max_team_size: 2,
  host_name: "Creative Mornings",
},
{
  event_id: 6,
  title: "Startup Pitch Competition",
  description: "Present your startup idea to investors and win seed funding",
  event_date: "2025-02-10T15:00:00Z",
  location: "Venture Hall, Austin",
  prize: "$25,000",
  event_type: "competition",
  capacity: 150,
  min_team_size: 1,
  max_team_size: 4,
  host_name: "Founders Fund",
},
{
  event_id: 7,
  title: "Cloud Native Conference",
  description: "Deep dive into Kubernetes, serverless, and DevOps practices",
  event_date: "2025-03-05T08:30:00Z",
  location: "Convention Center, Seattle",
  prize: "Free Cloud Credits",
  event_type: "conference",
  capacity: 800,
  min_team_size: 1,
  max_team_size: 1,
  host_name: "CNCF",
},
{
  event_id: 8,
  title: "Cybersecurity Bootcamp",
  description: "Intensive training on ethical hacking and threat detection",
  event_date: "2024-12-10T09:00:00Z",
  location: "Virtual",
  prize: "Certification",
  event_type: "workshop",
  capacity: 100,
  min_team_size: 1,
  max_team_size: 1,
  host_name: "SecureTech",
}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section with Glassmorphism */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/90 via-indigo-500/90 to-blue-700/90 backdrop-blur-sm text-white py-20 shadow-lg">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            {user ? `Welcome back, ${getDisplayName()}` : "Discover Amazing Events"}
          </h1>
          <p className="text-lg md:text-xl mb-8 text-blue-100 font-light">
            {user ? "Ready for your next adventure" : "Join hackathons, workshops, and competitions near you"}
          </p>
          
          {/* Search Bar - Glass style */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-200 w-5 h-5" />
            <input
              type="text"
              placeholder="Search events by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all shadow-lg"
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Stats Section - Glassmorphic cards */}
        {user && (
          <div className="mb-12">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-md border border-white/40 p-6 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Events Participated</p>
                    <p className="text-3xl font-bold text-blue-600">{registeredEvents.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-md border border-white/40 p-6 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Active Teams</p>
                    <p className="text-3xl font-bold text-indigo-600">
                      {registeredEvents.filter(r => r.team_name).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-md border border-white/40 p-6 transition-all hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Available Events</p>
                    <p className="text-3xl font-bold text-emerald-600">{events.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Events Section - Glass cards */}
        {topEvents.length > 0 && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                Top Picks For You
              </h2>
              <Link href="/events" className="text-blue-500 hover:text-blue-700 font-medium transition">View all →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {topEvents.map((event) => (
                <div key={event.event_id} className="bg-white/70 backdrop-blur-md rounded-2xl shadow-md border border-white/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* <div className="relative h-40 bg-gradient-to-r from-blue-500/80 to-indigo-500/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="absolute inset-0 bg-white/10"></div>
                    <span className="relative text-4xl opacity-80">⚡</span>
                    <span className="absolute top-3 right-3 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-lg text-xs font-semibold text-slate-700">
                      {event.event_type}
                    </span>
                  </div> */}
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">{event.title}</h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-slate-600">
                        <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                        {new Date(event.event_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-slate-600">
                        <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                        {event.location}
                      </div>
                      <div className="flex items-center text-slate-600">
                        <Trophy className="w-4 h-4 mr-2 text-amber-500" />
                        {event.prize}
                      </div>
                    </div>
                    <Link
                      href={`/events/${event.event_id}`}
                      className="mt-4 block text-center px-4 py-2 bg-blue-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-blue-600 transition shadow-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Events Section - Glass cards */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">All Events</h2>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 bg-white/60 backdrop-blur-md rounded-2xl shadow-md border border-white/40">
              <p className="text-slate-500">No events found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div key={event.event_id} className="bg-white/70 backdrop-blur-md rounded-2xl shadow-md border border-white/50 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-1 bg-blue-100/80 text-blue-700 text-xs rounded-full font-medium">
                        {event.event_type}
                      </span>
                      <Users className="w-4 h-4 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-1">{event.title}</h3>
                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                    <div className="space-y-1 text-sm border-t border-slate-200/50 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date:</span>
                        <span className="font-medium text-slate-700">{new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Venue:</span>
                        <span className="font-medium text-slate-700 truncate max-w-[150px]">{event.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Prize:</span>
                        <span className="font-medium text-emerald-600">{event.prize}</span>
                      </div>
                    </div>
                    <Link
                      href={`/events/${event.event_id}`}
                      className="mt-4 block text-center px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50/80 transition text-sm font-medium"
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