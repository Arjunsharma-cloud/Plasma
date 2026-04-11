"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCircle, XCircle, Info, AlertCircle } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Load notifications from localStorage or create demo notifications
    const registeredEvents = JSON.parse(localStorage.getItem("registeredEvents") || "[]");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    
    const notifs = [
      {
        id: 1,
        title: "Welcome to EventHub!",
        message: "Start exploring events and register for your favorites.",
        type: "info",
        read: false,
        created_at: new Date().toISOString(),
      },
      ...registeredEvents.map((reg: any, index: number) => ({
        id: index + 2,
        title: "Registration Confirmed",
        message: `You have successfully registered for "${reg.event_title}" with team "${reg.team_name}".`,
        type: "success",
        read: false,
        created_at: reg.registered_at,
      })),
    ];
    
    setNotifications(notifs);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "error":
        return <XCircle className="w-6 h-6 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              EventHub
            </Link>
            <Link href="/" className="text-gray-600 hover:text-blue-600">
              ← Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <Bell className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer ${notif.read ? 'opacity-60' : ''}`}
                onClick={() => markAsRead(notif.id)}
              >
                <div className="flex items-start">
                  <div className="mr-4">{getIcon(notif.type)}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{notif.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{notif.message}</p>
                    <p className="text-gray-400 text-xs mt-2">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}