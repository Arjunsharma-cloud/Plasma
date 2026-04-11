"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, MapPin, Trophy, Users, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function EventDetailPage() {
  const params = useParams();
  const [event, setEvent] = useState<any>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [registration, setRegistration] = useState({
    name: "",
    email: "",
    phone: "",
    teamName: "",
  });

  useEffect(() => {
    fetchEvent();
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`http://localhost:8083/api/events/${params.id}`);
      const data = await res.json();
      setEvent(data);
    } catch (error) {
      // Mock data
      setEvent({
        event_id: Number(params.id),
        title: "National Hackathon 2024",
        description: "Join us for an exciting 48-hour hackathon where you can build innovative solutions for real-world problems. Work in teams of 1-4 members and compete for exciting prizes worth $10,000!",
        event_date: "2024-12-15T10:00:00Z",
        location: "Convention Center, Hall A, New York",
        prize: "$10,000 + Goodies",
        event_type: "hackathon",
        capacity: 100,
        min_team_size: 1,
        max_team_size: 4,
        host_name: "Tech Events Organization",
      });
    }
  };

  const handleRegister = () => {
    if (!user) {
      toast.error("Please login first");
      return;
    }
    
    const teamName = registration.teamName || `${user.first_name}'s Team`;
    const existingRegistrations = JSON.parse(localStorage.getItem("registeredEvents") || "[]");
    existingRegistrations.push({
      event_id: event.event_id,
      event_title: event.title,
      team_name: teamName,
      registered_at: new Date().toISOString(),
    });
    localStorage.setItem("registeredEvents", JSON.stringify(existingRegistrations));
    
    toast.success(`Successfully registered for ${event.title}!`);
    setShowRegister(false);
  };

  if (!event) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/events" className="flex items-center text-gray-600 hover:text-blue-600">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Events
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-64 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-8xl">🎯</span>
          </div>
          
          <div className="p-8">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-gray-800">{event.title}</h1>
              <span className="px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {event.event_type}
              </span>
            </div>
            
            <p className="text-gray-700 mb-6 leading-relaxed">{event.description}</p>
            
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 mr-3 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Event Date & Time</p>
                  <p className="text-gray-600">{new Date(event.event_date).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                <MapPin className="w-5 h-5 mr-3 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-gray-600">{event.location}</p>
                </div>
              </div>
              <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                <Trophy className="w-5 h-5 mr-3 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Prize Pool</p>
                  <p className="text-gray-600">{event.prize}</p>
                </div>
              </div>
              <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                <Users className="w-5 h-5 mr-3 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Team Size</p>
                  <p className="text-gray-600">{event.min_team_size} - {event.max_team_size} members</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowRegister(true)}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition font-semibold"
            >
              Register for this Event
            </button>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Complete Registration</h2>
              <p className="text-gray-600 text-sm mb-6">Fill in your team details</p>
              
              <input
                type="text"
                placeholder="Full Name"
                value={registration.name}
                onChange={(e) => setRegistration({ ...registration, name: e.target.value })}
                className="w-full p-3 border rounded-lg mb-3"
              />
              <input
                type="email"
                placeholder="Email ID"
                value={registration.email}
                onChange={(e) => setRegistration({ ...registration, email: e.target.value })}
                className="w-full p-3 border rounded-lg mb-3"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={registration.phone}
                onChange={(e) => setRegistration({ ...registration, phone: e.target.value })}
                className="w-full p-3 border rounded-lg mb-3"
              />
              <input
                type="text"
                placeholder="Team Name"
                value={registration.teamName}
                onChange={(e) => setRegistration({ ...registration, teamName: e.target.value })}
                className="w-full p-3 border rounded-lg mb-4"
              />
              
              <div className="flex space-x-3">
                <button
                  onClick={handleRegister}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowRegister(false)}
                  className="px-4 py-3 border rounded-lg"
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