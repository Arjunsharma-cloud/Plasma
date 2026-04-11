"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, MapPin, Trophy, Users, X, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { getEvents } from "../lib/eventService";

// Define types
interface Event {
  event_id: number;  // Make sure this is required, not optional
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
      console.log("Backend not available, using localStorage events");
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
      toast.error("Please login first");
      return;
    }

    if (!selectedEvent) {
      toast.error("No event selected");
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
    
    toast.success(`Successfully registered for ${selectedEvent.title}!`);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              EventHub
            </Link>
            <Link href="/" className="text-gray-600 hover:text-blue-600 transition">
              ← Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">All Events</h1>
          {/* {usingMockData && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
              Demo Mode (Backend not connected)
            </span>
          )} */}
        </div>
        
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search events by title, description, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {getEventTypes().map((type) => (
                <option key={type} value={type}>
                  {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-gray-600 mb-4">Found {filteredEvents.length} events</p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event, index) => (
            <div key={event.event_id || index} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="relative h-48 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-6xl">
                  {event.event_type === "hackathon" && "💻"}
                  {event.event_type === "workshop" && "🔧"}
                  {event.event_type === "conference" && "🎙️"}
                  {event.event_type === "competition" && "🏆"}
                </span>
                <span className="absolute top-4 right-4 px-3 py-1 bg-white/90 rounded-full text-xs font-semibold text-gray-700">
                  {event.event_type}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1">{event.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    {new Date(event.event_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                    {event.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
                    {event.prize}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-2 text-green-500" />
                    Team: {event.min_team_size} - {event.max_team_size} members
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowRegisterForm(true);
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:opacity-90 transition font-medium"
                >
                  Register Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md">
            <p className="text-gray-500">No events found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && !showRegisterForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">{selectedEvent.title}</h2>
              <button onClick={() => setSelectedEvent(null)} className="p-1 hover:bg-gray-100 rounded-full transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{selectedEvent.event_type}</span>
              </div>
              <p className="text-gray-700 mb-6">{selectedEvent.description}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 mr-3 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">Event Date</p>
                    <p className="text-gray-600">{new Date(selectedEvent.event_date).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 mr-3 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">Location</p>
                    <p className="text-gray-600">{selectedEvent.location}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Trophy className="w-5 h-5 mr-3 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">Prize Pool</p>
                    <p className="text-gray-600">{selectedEvent.prize}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="w-5 h-5 mr-3 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">Team Requirements</p>
                    <p className="text-gray-600">Min: {selectedEvent.min_team_size} | Max: {selectedEvent.max_team_size} members</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowRegisterForm(true)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:opacity-90 transition font-medium"
              >
                Register for this Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form Modal */}
      {showRegisterForm && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Register for {selectedEvent.title}</h2>
              <p className="text-gray-600 text-sm mb-6">Fill in your details to confirm registration</p>
              
              <input
                type="text"
                placeholder="Full Name"
                value={registration.name}
                onChange={(e) => setRegistration({ ...registration, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              />
              <input
                type="email"
                placeholder="Email ID"
                value={registration.email}
                onChange={(e) => setRegistration({ ...registration, email: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={registration.phone}
                onChange={(e) => setRegistration({ ...registration, phone: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              />
              <input
                type="text"
                placeholder="Team Name (optional)"
                value={registration.teamName}
                onChange={(e) => setRegistration({ ...registration, teamName: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              />
              
              <div className="flex space-x-3">
                <button
                  onClick={handleRegister}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:opacity-90 transition font-medium"
                >
                  Confirm Registration
                </button>
                <button
                  onClick={() => {
                    setShowRegisterForm(false);
                    setSelectedEvent(null);
                  }}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}