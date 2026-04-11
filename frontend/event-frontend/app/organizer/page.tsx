"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Plus, Bell, Calendar, Trophy, Users, BarChart3, 
  X, Trash2, Eye, Send, TrendingUp, Activity, MapPin
} from "lucide-react";
import toast from "react-hot-toast";
import { getEvents, addEvent, deleteEvent, Event } from "../lib/eventService";

const ALLOWED_ORGANIZER_EMAIL = "abhishek@gmail.com";

interface Registration {
  id: number;
  event_id: number;
  event_title: string;
  team_name: string;
  user_email: string;
  registered_at: string;
  status: string;
}

export default function OrganizerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedEventForNotification, setSelectedEventForNotification] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<Event | null>(null);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_date: "",
    registration_deadline: "",
    capacity: "",
    location: "",
    prize: "",
    event_type: "hackathon",
    min_team_size: "1",
    max_team_size: "4",
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(savedUser);
    setUser(userData);

    if (userData.email === ALLOWED_ORGANIZER_EMAIL) {
      setIsAuthorized(true);
      loadEvents();
      loadRegistrations();
    } else {
      toast.error("Access denied. Organizer only.");
      router.push("/");
    }
  }, []);

  const loadEvents = () => {
    const sharedEvents = getEvents();
    setEvents(sharedEvents);
  };

  const loadRegistrations = () => {
    const savedRegistrations = localStorage.getItem("allRegistrations");
    if (savedRegistrations) {
      setRegistrations(JSON.parse(savedRegistrations));
    } else {
      const defaultRegistrations: Registration[] = [
        {
          id: 1,
          event_id: 1,
          event_title: "National Hackathon 2024",
          team_name: "Code Masters",
          user_email: "john@example.com",
          registered_at: new Date().toISOString(),
          status: "confirmed",
        },
        {
          id: 2,
          event_id: 1,
          event_title: "National Hackathon 2024",
          team_name: "Bug Busters",
          user_email: "jane@example.com",
          registered_at: new Date().toISOString(),
          status: "confirmed",
        },
        {
          id: 3,
          event_id: 2,
          event_title: "AI Workshop 2024",
          team_name: "AI Enthusiasts",
          user_email: "mike@example.com",
          registered_at: new Date().toISOString(),
          status: "confirmed",
        },
      ];
      setRegistrations(defaultRegistrations);
      localStorage.setItem("allRegistrations", JSON.stringify(defaultRegistrations));
    }
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.event_date) {
      toast.error("Please fill required fields");
      return;
    }

    const newEventObj = {
      title: newEvent.title,
      description: newEvent.description,
      event_date: newEvent.event_date,
      registration_deadline: newEvent.registration_deadline || newEvent.event_date,
      capacity: parseInt(newEvent.capacity) || 0,
      location: newEvent.location,
      prize: newEvent.prize,
      event_type: newEvent.event_type,
      min_team_size: parseInt(newEvent.min_team_size) || 1,
      max_team_size: parseInt(newEvent.max_team_size) || 1,
      host_name: user?.first_name || "Organizer",
    };

    const updatedEvents = addEvent(newEventObj);
    setEvents(updatedEvents);
    toast.success("Event created successfully");
    setShowAddEvent(false);
    setNewEvent({
      title: "",
      description: "",
      event_date: "",
      registration_deadline: "",
      capacity: "",
      location: "",
      prize: "",
      event_type: "hackathon",
      min_team_size: "1",
      max_team_size: "4",
    });
  };

  const handleDeleteEvent = (eventId: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      const updatedEvents = deleteEvent(eventId);
      setEvents(updatedEvents);
      toast.success("Event deleted");
    }
  };

  const handleSendNotification = () => {
    if (!notificationMessage) {
      toast.error("Please enter a notification message");
      return;
    }

    if (!selectedEventForNotification) {
      toast.error("No event selected");
      return;
    }

    const eventRegistrations = registrations.filter(r => r.event_id === selectedEventForNotification.event_id);
    const userEmails = [...new Set(eventRegistrations.map(r => r.user_email))];

    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    const newNotification = {
      id: Date.now(),
      event_id: selectedEventForNotification.event_id,
      event_title: selectedEventForNotification.title,
      message: notificationMessage,
      recipients: userEmails,
      sent_at: new Date().toISOString(),
    };
    notifications.push(newNotification);
    localStorage.setItem("notifications", JSON.stringify(notifications));

    toast.success(`Notification sent to ${userEmails.length} users`);
    setShowNotificationModal(false);
    setNotificationMessage("");
    setSelectedEventForNotification(null);
  };

  const getEventRegistrations = (eventId: number) => {
    return registrations.filter(r => r.event_id === eventId);
  };

  const getTotalRegistrations = () => {
    return registrations.length;
  };

  const getActiveEvents = () => {
    return events.filter(e => new Date(e.event_date) > new Date()).length;
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-4">You lack permissions to view this dashboard.</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">Return to Home</Link>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Events", value: events.length, icon: Calendar },
    { label: "Total Registrations", value: getTotalRegistrations(), icon: Users },
    { label: "Active Events", value: getActiveEvents(), icon: Activity },
    { label: "Avg Registrations/Event", value: events.length ? Math.round(getTotalRegistrations() / events.length) : 0, icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl text-blue-700 tracking-tight">
                EventHub Organizer
              </span>
            </Link>
            <div className="flex items-center space-x-6">
              <span className="text-sm font-medium text-slate-600">Admin: {user?.email}</span>
              <Link href="/" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
                Back to Portal
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
            <p className="text-slate-500 mt-1">Manage operations, track registrations, and monitor analytics.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (events.length === 0) {
                  toast.error("No active events available");
                  return;
                }
                setSelectedEventForNotification(events[0]);
                setShowNotificationModal(true);
              }}
              className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm"
            >
              <Bell className="w-4 h-4 mr-2 text-slate-500" />
              Notify Attendees
            </button>
            <button
              onClick={() => setShowAddEvent(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Analytics Section - Overhauled to a professional table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mb-8">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Registration Analytics
            </h2>
          </div>
          <div className="overflow-x-auto">
            {events.length === 0 ? (
              <p className="text-slate-500 text-center py-8 text-sm">No data available. Create an event to view analytics.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Event Name</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Registered</th>
                    <th className="px-6 py-3 font-medium">Capacity</th>
                    <th className="px-6 py-3 font-medium w-1/3">Fill Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map((event, idx) => {
                    const count = getEventRegistrations(event.event_id).length;
                    const capacity = event.capacity || 1; // Prevent division by zero
                    const percentage = Math.min(Math.round((count / capacity) * 100), 100);
                    const isActive = new Date(event.event_date) > new Date();

                    return (
                      <tr key={event.event_id || idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800">{event.title}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${
                            isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                            {isActive ? "Active" : "Ended"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{count}</td>
                        <td className="px-6 py-4 text-slate-600">{event.capacity || "Unlimited"}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-700 font-medium w-10">{percentage}%</span>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  percentage >= 100 ? 'bg-red-500' : percentage > 75 ? 'bg-amber-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Events Management List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mb-8">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Event Management
            </h2>
            <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200">
              {events.length} Total
            </span>
          </div>
          
          {events.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-500 mb-4">Your event repository is empty.</p>
              <button
                onClick={() => setShowAddEvent(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
              >
                Create Initial Event
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {events.map((event, index) => {
                const eventRegistrations = getEventRegistrations(event.event_id);
                return (
                  <div key={event.event_id || index} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-md border border-slate-200 uppercase tracking-wide">
                            {event.event_type}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{event.title}</h3>
                        <p className="text-slate-600 text-sm mb-4 leading-relaxed max-w-3xl">
                          {event.description?.substring(0, 180)}...
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                            {new Date(event.event_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />
                            {event.location}
                          </div>
                          <div className="flex items-center">
                            <Trophy className="w-4 h-4 mr-1.5 text-slate-400" />
                            {event.prize || "No Prize"}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1.5 text-slate-400" />
                            {eventRegistrations.length} / {event.capacity || "∞"} Attendees
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-6">
                        <button
                          onClick={() => setSelectedEventForDetails(event)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.event_id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {eventRegistrations.length > 0 && (
                      <div className="mt-5 pt-5 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recent Registrations</p>
                        <div className="flex flex-wrap gap-2">
                          {eventRegistrations.map((reg, idx) => (
                            <span key={reg.id || idx} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-md shadow-sm">
                              {reg.team_name} <span className="text-slate-400 ml-1 font-normal">({reg.user_email})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-auto border border-slate-200">
            <div className="sticky top-0 bg-white p-5 border-b border-slate-100 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Create New Event</h2>
              <button onClick={() => setShowAddEvent(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Event Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="e.g., Q3 Engineering Summit"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    rows={4}
                    placeholder="Enter comprehensive event details..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Event Date <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Registration Deadline</label>
                  <input
                    type="datetime-local"
                    value={newEvent.registration_deadline}
                    onChange={(e) => setNewEvent({ ...newEvent, registration_deadline: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Capacity</label>
                  <input
                    type="number"
                    value={newEvent.capacity}
                    onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="Max attendees"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="Venue or virtual link"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Event Type</label>
                  <select
                    value={newEvent.event_type}
                    onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  >
                    <option value="hackathon">Hackathon</option>
                    <option value="workshop">Workshop</option>
                    <option value="conference">Conference</option>
                    <option value="competition">Competition</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prize Pool</label>
                  <input
                    type="text"
                    value={newEvent.prize}
                    onChange={(e) => setNewEvent({ ...newEvent, prize: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="e.g., $5,000 Total"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Min Team Size</label>
                  <input
                    type="number"
                    value={newEvent.min_team_size}
                    onChange={(e) => setNewEvent({ ...newEvent, min_team_size: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Max Team Size</label>
                  <input
                    type="number"
                    value={newEvent.max_team_size}
                    onChange={(e) => setNewEvent({ ...newEvent, max_team_size: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8 pt-5 border-t border-slate-100">
                <button
                  onClick={() => setShowAddEvent(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvent}
                  className="flex-1 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm"
                >
                  Confirm & Create Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && selectedEventForNotification && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3 border border-blue-100">
                  <Send className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Broadcast Message</h2>
                  <p className="text-slate-500 text-xs font-medium">To: {selectedEventForNotification.title}</p>
                </div>
              </div>
              
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                rows={5}
                placeholder="Type your notification message here..."
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNotificationModal(false);
                    setSelectedEventForNotification(null);
                    setNotificationMessage("");
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendNotification}
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm transition-colors shadow-sm flex justify-center items-center"
                >
                  Dispatch Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEventForDetails && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl shrink-0">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{selectedEventForDetails.title}</h2>
              <button onClick={() => setSelectedEventForDetails(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold uppercase tracking-wider">
                  {selectedEventForDetails.event_type}
                </span>
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border ${
                  new Date(selectedEventForDetails.event_date) > new Date() 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}>
                  {new Date(selectedEventForDetails.event_date) > new Date() ? "Active" : "Ended"}
                </span>
              </div>
              
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-6">
                <p className="text-slate-700 text-sm leading-relaxed">{selectedEventForDetails.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                    <Calendar className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Date & Time</p>
                    <p className="text-sm font-medium text-slate-800">{new Date(selectedEventForDetails.event_date).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                    <MapPin className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Location</p>
                    <p className="text-sm font-medium text-slate-800">{selectedEventForDetails.location}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                    <Trophy className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Prize Pool</p>
                    <p className="text-sm font-medium text-slate-800">{selectedEventForDetails.prize || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                    <Users className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Team Configuration</p>
                    <p className="text-sm font-medium text-slate-800">{selectedEventForDetails.min_team_size} - {selectedEventForDetails.max_team_size} members</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
                  Participant Roster 
                  <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-md text-xs border border-slate-200">
                    {getEventRegistrations(selectedEventForDetails.event_id).length}
                  </span>
                </h3>
                
                {getEventRegistrations(selectedEventForDetails.event_id).length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-6 text-center">
                    <p className="text-slate-500 text-sm">No registrations on file yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {getEventRegistrations(selectedEventForDetails.event_id).map((reg, idx) => (
                      <div key={reg.id || idx} className="flex justify-between items-center p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-200 transition-colors">
                        <div>
                          <p className="font-semibold text-sm text-slate-800">{reg.team_name}</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">{reg.user_email}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium rounded-md uppercase tracking-wide">
                          {reg.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}