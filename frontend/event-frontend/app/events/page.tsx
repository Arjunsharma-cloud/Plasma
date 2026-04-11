"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, MapPin, Trophy, Users, X, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { getEvents } from "../lib/eventService";

interface Event {
  event_id: number;
  title: string;
  description: string;
  event_date: string;
  location: string;
  prize: string;
  event_type: string;
  capacity: number;
  min_team_size: number;
  max_team_size: number;
  host_name: string;
}

interface User {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  college: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [usingMockData, setUsingMockData] = useState(false);
  const [registration, setRegistration] = useState({
    name: "",
    email: "",
    phone: "",
    teamName: "",
  });

  useEffect(() => {
    fetchEvents();
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setRegistration({
        name: `${userData.first_name || ""} ${userData.last_name || ""}`,
        email: userData.email || "",
        phone: userData.phone || "",
        teamName: "",
      });
    }
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8083/api/events");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
          setFilteredEvents(data);
          setUsingMockData(false);
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.log("Backend not available, falling back to local events.");
    }
    
    const sharedEvents = getEvents();
    setEvents(sharedEvents);
    setFilteredEvents(sharedEvents);
    setUsingMockData(true);
    setLoading(false);
  };

  useEffect(() => {
    let filtered = events;
    
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.event_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedType !== "all") {
      filtered = filtered.filter(event => event.event_type === selectedType);
    }
    
    setFilteredEvents(filtered);
  }, [searchTerm, selectedType, events]);

  const getEventTypes = () => {
    const types = new Set(events.map(event => event.event_type));
    return ["all", ...Array.from(types)];
  };

  const handleRegister = () => {
    if (!user) {
      toast.error("Authentication required. Please log in.");
      return;
    }

    if (!selectedEvent) {
      toast.error("Invalid event selection.");
      return;
    }

    const teamName = registration.teamName || `${user.first_name || user.email?.split('@')[0]}'s Team`;
    
    const existingRegistrations = JSON.parse(localStorage.getItem("registeredEvents") || "[]");
    existingRegistrations.push({
      event_id: selectedEvent.event_id,
      event_title: selectedEvent.title,
      team_name: teamName,
      registered_at: new Date().toISOString(),
    });
    localStorage.setItem("registeredEvents", JSON.stringify(existingRegistrations));
    
    toast.success(`Successfully registered for ${selectedEvent.title}`);
    setShowRegisterForm(false);
    setSelectedEvent(null);
    
    setRegistration({
      name: `${user.first_name || ""} ${user.last_name || ""}`,
      email: user.email || "",
      phone: user.phone || "",
      teamName: "",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm font-medium tracking-wide">Retrieving events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="font-bold text-xl text-blue-700 tracking-tight">
              EventHub
            </Link>
            <Link href="/" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
              Return to Portal
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Event Directory</h1>
          <p className="text-slate-500 mt-1 text-sm">Discover and register for upcoming technical events and competitions.</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by keyword, technology, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="relative w-full">
              <Filter className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none"
              >
                {getEventTypes().map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Categories" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
            Showing {filteredEvents.length} Results
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event, index) => (
            <div key={event.event_id || index} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 uppercase tracking-wide">
                    {event.event_type}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{event.title}</h3>
                <p className="text-slate-600 text-sm mb-6 line-clamp-2 leading-relaxed">{event.description}</p>
                
                <div className="space-y-2.5">
                  <div className="flex items-center text-sm font-medium text-slate-500">
                    <Calendar className="w-4 h-4 mr-2.5 text-slate-400" />
                    {new Date(event.event_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm font-medium text-slate-500">
                    <MapPin className="w-4 h-4 mr-2.5 text-slate-400" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center text-sm font-medium text-slate-500">
                    <Trophy className="w-4 h-4 mr-2.5 text-slate-400" />
                    <span className="truncate">{event.prize || "No Prize"}</span>
                  </div>
                  <div className="flex items-center text-sm font-medium text-slate-500">
                    <Users className="w-4 h-4 mr-2.5 text-slate-400" />
                    Team: {event.min_team_size}-{event.max_team_size} pax
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowRegisterForm(true);
                  }}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors font-semibold text-sm shadow-sm"
                >
                  View Details & Register
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500 text-sm font-medium">No events align with your current search criteria.</p>
            <button 
              onClick={() => { setSearchTerm(""); setSelectedType("all"); }}
              className="mt-4 text-blue-600 text-sm font-semibold hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && !showRegisterForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl shrink-0">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{selectedEvent.title}</h2>
              <button onClick={() => setSelectedEvent(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="mb-6">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold uppercase tracking-wider">
                  {selectedEvent.event_type}
                </span>
              </div>
              
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-5 mb-8">
                <p className="text-slate-700 text-sm leading-relaxed">{selectedEvent.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                    <Calendar className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Date & Time</p>
                    <p className="text-sm font-medium text-slate-800">{new Date(selectedEvent.event_date).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                    <MapPin className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Location</p>
                    <p className="text-sm font-medium text-slate-800">{selectedEvent.location}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                    <Trophy className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Prize Pool</p>
                    <p className="text-sm font-medium text-slate-800">{selectedEvent.prize || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                    <Users className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Team Configuration</p>
                    <p className="text-sm font-medium text-slate-800">Min {selectedEvent.min_team_size} • Max {selectedEvent.max_team_size}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowRegisterForm(true)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
                >
                  Proceed to Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form Modal */}
      {showRegisterForm && selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200">
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-1 tracking-tight">Registration Data</h2>
              <p className="text-slate-500 text-sm mb-6">Securing slot for: <span className="font-semibold text-slate-700">{selectedEvent.title}</span></p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={registration.name}
                    onChange={(e) => setRegistration({ ...registration, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={registration.email}
                    onChange={(e) => setRegistration({ ...registration, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Contact Number</label>
                  <input
                    type="tel"
                    value={registration.phone}
                    onChange={(e) => setRegistration({ ...registration, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Team Alias <span className="text-slate-400 font-normal lowercase">(Optional)</span></label>
                  <input
                    type="text"
                    value={registration.teamName}
                    onChange={(e) => setRegistration({ ...registration, teamName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRegisterForm(false);
                    setSelectedEvent(null);
                  }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegister}
                  className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm shadow-sm"
                >
                  Submit Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}