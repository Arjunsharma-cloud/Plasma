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
    toast.success("Event created successfully!");
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
      toast.success("Event deleted successfully!");
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

    toast.success(`Notification sent to ${userEmails.length} users!`);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <Link href="/" className="text-blue-600 hover:underline">Return to Home</Link>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Events", value: events.length, icon: Calendar, color: "blue" },
    { label: "Total Registrations", value: getTotalRegistrations(), icon: Users, color: "green" },
    { label: "Active Events", value: getActiveEvents(), icon: Activity, color: "purple" },
    { label: "Avg Registrations/Event", value: events.length ? Math.round(getTotalRegistrations() / events.length) : 0, icon: TrendingUp, color: "orange" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                EventHub Organizer
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.first_name || user?.email}</span>
              <Link href="/" className="text-gray-600 hover:text-blue-600 transition">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome back, Admin! 👋</h1>
          <p className="text-gray-600 mt-1">Manage your events and track registrations</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-${stat.color}-100 rounded-full flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowAddEvent(true)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:opacity-90 transition font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Event
          </button>
          <button
            onClick={() => {
              if (events.length === 0) {
                toast.error("No events to send notifications for");
                return;
              }
              setSelectedEventForNotification(events[0]);
              setShowNotificationModal(true);
            }}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium"
          >
            <Bell className="w-5 h-5 mr-2" />
            Send Notification
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              My Events ({events.length})
            </h2>
          </div>
          
          {events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No events created yet</p>
              <button
                onClick={() => setShowAddEvent(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create your first event
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {events.map((event, index) => {
                const eventRegistrations = getEventRegistrations(event.event_id);
                return (
                  <div key={event.event_id || index} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            new Date(event.event_date) > new Date() 
                              ? "bg-green-100 text-green-700" 
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {new Date(event.event_date) > new Date() ? "Active" : "Ended"}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {event.event_type}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{event.description?.substring(0, 150)}...</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(event.event_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-gray-500">
                            <MapPin className="w-4 h-4 mr-1" />
                            {event.location}
                          </div>
                          <div className="flex items-center text-gray-500">
                            <Trophy className="w-4 h-4 mr-1" />
                            {event.prize}
                          </div>
                          <div className="flex items-center text-gray-500">
                            <Users className="w-4 h-4 mr-1" />
                            {eventRegistrations.length} / {event.capacity} registered
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => setSelectedEventForDetails(event)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEventForNotification(event);
                            setShowNotificationModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Send Notification"
                        >
                          <Bell className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.event_id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Event"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {eventRegistrations.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-2">Registered Teams ({eventRegistrations.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {eventRegistrations.map((reg, idx) => (
                            <span key={reg.id || idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                              {reg.team_name} ({reg.user_email})
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

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
              Analytics - Registrations per Event
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {events.map((event, idx) => {
                const count = getEventRegistrations(event.event_id).length;
                const percentage = event.capacity ? (count / event.capacity) * 100 : 0;
                return (
                  <div key={event.event_id || idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{event.title}</span>
                      <span className="text-gray-500">{count} / {event.capacity} registrations</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {events.length === 0 && (
                <p className="text-gray-500 text-center py-4">No events to display analytics</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 my-8">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Create New Event</h2>
              <button onClick={() => setShowAddEvent(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Enter event title"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    rows={3}
                    placeholder="Describe your event"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
                  <input
                    type="datetime-local"
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
                  <input
                    type="datetime-local"
                    value={newEvent.registration_deadline}
                    onChange={(e) => setNewEvent({ ...newEvent, registration_deadline: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={newEvent.capacity}
                    onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Max participants"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Venue or Online"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prize</label>
                  <input
                    type="text"
                    value={newEvent.prize}
                    onChange={(e) => setNewEvent({ ...newEvent, prize: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Prize pool"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select
                    value={newEvent.event_type}
                    onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="hackathon">Hackathon</option>
                    <option value="workshop">Workshop</option>
                    <option value="conference">Conference</option>
                    <option value="competition">Competition</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Team Size</label>
                  <input
                    type="number"
                    value={newEvent.min_team_size}
                    onChange={(e) => setNewEvent({ ...newEvent, min_team_size: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Team Size</label>
                  <input
                    type="number"
                    value={newEvent.max_team_size}
                    onChange={(e) => setNewEvent({ ...newEvent, max_team_size: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddEvent}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:opacity-90"
                >
                  Create Event
                </button>
                <button
                  onClick={() => setShowAddEvent(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && selectedEventForNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Send Notification</h2>
              <p className="text-gray-600 text-sm mb-4">
                Send notification to users registered for: <strong>{selectedEventForNotification.title}</strong>
              </p>
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                className="w-full p-3 border rounded-lg mb-4"
                rows={4}
                placeholder="Enter your notification message..."
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSendNotification}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Send className="w-4 h-4 inline mr-2" />
                  Send Notification
                </button>
                <button
                  onClick={() => {
                    setShowNotificationModal(false);
                    setSelectedEventForNotification(null);
                    setNotificationMessage("");
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEventForDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">{selectedEventForDetails.title}</h2>
              <button onClick={() => setSelectedEventForDetails(null)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 flex gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{selectedEventForDetails.event_type}</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  new Date(selectedEventForDetails.event_date) > new Date() 
                    ? "bg-green-100 text-green-700" 
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {new Date(selectedEventForDetails.event_date) > new Date() ? "Active" : "Ended"}
                </span>
              </div>
              <p className="text-gray-700 mb-6">{selectedEventForDetails.description}</p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 mr-3 text-blue-600 mt-0.5" />
                  <div><p className="font-medium text-gray-800">Event Date</p><p className="text-gray-600">{new Date(selectedEventForDetails.event_date).toLocaleString()}</p></div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 mr-3 text-blue-600 mt-0.5" />
                  <div><p className="font-medium text-gray-800">Location</p><p className="text-gray-600">{selectedEventForDetails.location}</p></div>
                </div>
                <div className="flex items-start">
                  <Trophy className="w-5 h-5 mr-3 text-yellow-600 mt-0.5" />
                  <div><p className="font-medium text-gray-800">Prize</p><p className="text-gray-600">{selectedEventForDetails.prize}</p></div>
                </div>
                <div className="flex items-start">
                  <Users className="w-5 h-5 mr-3 text-green-600 mt-0.5" />
                  <div><p className="font-medium text-gray-800">Team Size</p><p className="text-gray-600">{selectedEventForDetails.min_team_size} - {selectedEventForDetails.max_team_size} members</p></div>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 mb-3">Registered Teams ({getEventRegistrations(selectedEventForDetails.event_id).length})</h3>
              <div className="space-y-2">
                {getEventRegistrations(selectedEventForDetails.event_id).map((reg, idx) => (
                  <div key={reg.id || idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div><p className="font-medium">{reg.team_name}</p><p className="text-sm text-gray-500">{reg.user_email}</p></div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{reg.status}</span>
                  </div>
                ))}
                {getEventRegistrations(selectedEventForDetails.event_id).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No registrations yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}