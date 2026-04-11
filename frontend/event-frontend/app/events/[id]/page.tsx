"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, MapPin, Trophy, Users, ArrowLeft, Clock, Activity, AlertCircle } from "lucide-react";
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
      // Enhanced mock data with 'registered' count for analytics feel
      setEvent({
        event_id: Number(params.id),
        title: "National Hackathon 2024",
        description: "Join us for an intensive 48-hour hackathon to architect and deploy innovative solutions for real-world systemic challenges. Collaborate with top engineering talent, leverage cutting-edge APIs, and present your prototypes to industry leaders. Judging criteria will focus on technical complexity, scalability, and practical impact.",
        event_date: "2024-12-15T10:00:00Z",
        location: "Convention Center, Hall A, New York",
        prize: "$10,000",
        event_type: "Hackathon",
        capacity: 100,
        registered: 78, 
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

  if (!event) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
      <Activity className="w-6 h-6 animate-pulse mr-2" /> Loading event data...
    </div>
  );

  // Calculate capacity percentage for the analytics progress bar
  const capacityPercentage = Math.round((event.registered / event.capacity) * 100);
  const isNearCapacity = capacityPercentage > 85;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/events" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center space-x-3 mb-4">
            <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide uppercase rounded-md">
              {event.event_type}
            </span>
            <span className="flex items-center text-sm text-slate-500">
              <Clock className="w-4 h-4 mr-1.5" />
              {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            {event.title}
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
            {event.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Analytics & Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Event Metrics Dashboard */}
            <div>
              <h3 className="text-lg font-semibold border-b border-slate-200 pb-3 mb-5">Event Parameters</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Metric Card 1 */}
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-start space-x-4">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Schedule</p>
                    <p className="text-base font-semibold text-slate-900 mt-0.5">
                      {new Date(event.event_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} EST
                    </p>
                  </div>
                </div>

                {/* Metric Card 2 */}
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-start space-x-4">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Location</p>
                    <p className="text-base font-semibold text-slate-900 mt-0.5 truncate max-w-[200px]" title={event.location}>
                      {event.location.split(',')[0]}
                    </p>
                  </div>
                </div>

                {/* Metric Card 3 */}
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-start space-x-4">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Prize Pool</p>
                    <p className="text-base font-semibold text-slate-900 mt-0.5">{event.prize}</p>
                  </div>
                </div>

                {/* Metric Card 4 */}
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-start space-x-4">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Team Size</p>
                    <p className="text-base font-semibold text-slate-900 mt-0.5">
                      {event.min_team_size} - {event.max_team_size} Members
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right Column: Sticky Registration Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sticky top-24">
              
              {/* Analytics: Capacity Indicator */}
              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-slate-900">Registration Status</span>
                  <span className="text-sm font-medium text-slate-500">
                    {event.registered} / {event.capacity}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${isNearCapacity ? 'bg-amber-500' : 'bg-blue-600'}`}
                    style={{ width: `${capacityPercentage}%` }}
                  ></div>
                </div>
                {isNearCapacity && (
                  <p className="flex items-center text-xs text-amber-600 font-medium mt-2">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    Approaching maximum capacity
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-6 mb-6">
                <p className="text-sm text-slate-500 mb-1">Hosted by</p>
                <p className="font-medium text-slate-900">{event.host_name}</p>
              </div>

              <button
                onClick={() => setShowRegister(true)}
                className="w-full px-6 py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
              >
                Secure Your Spot
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Registration Modal - Cleaned Up */}
      {showRegister && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Complete Registration</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={registration.name}
                    onChange={(e) => setRegistration({ ...registration, name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Work Email</label>
                  <input
                    type="email"
                    value={registration.email}
                    onChange={(e) => setRegistration({ ...registration, email: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={registration.phone}
                      onChange={(e) => setRegistration({ ...registration, phone: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Team Name</label>
                    <input
                      type="text"
                      value={registration.teamName}
                      onChange={(e) => setRegistration({ ...registration, teamName: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-8">
                <button
                  onClick={() => setShowRegister(false)}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegister}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
                >
                  Confirm Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}