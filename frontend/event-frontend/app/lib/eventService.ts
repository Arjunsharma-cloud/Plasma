// app/lib/eventService.ts

// Define Event interface
export interface Event {
  event_id: number;  // Changed from event_id?: number to event_id: number
  title: string;
  description: string;
  event_date: string;
  registration_deadline?: string;
  capacity: number;
  location: string;
  prize: string;
  event_type: string;
  min_team_size: number;
  max_team_size: number;
  host_name: string;
  created_at?: string;
}

// Shared Mock Events
const DEFAULT_MOCK_EVENTS: Event[] = [
  {
    event_id: 1,
    title: "National Hackathon 2024",
    description: "Build innovative solutions for real-world problems. Join teams of 1-4 members and compete for exciting prizes worth $10,000!",
    event_date: "2024-12-15T10:00:00Z",
    registration_deadline: "2024-12-01T23:59:59Z",
    capacity: 100,
    location: "Convention Center, Hall A, New York",
    prize: "$10,000",
    event_type: "hackathon",
    min_team_size: 1,
    max_team_size: 4,
    host_name: "Tech Events Org",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    event_id: 2,
    title: "AI Workshop 2024",
    description: "Learn about artificial intelligence and machine learning from industry experts.",
    event_date: "2024-11-25T14:00:00Z",
    registration_deadline: "2024-11-20T23:59:59Z",
    capacity: 200,
    location: "Virtual Conference (Zoom)",
    prize: "Certificate + Goodies",
    event_type: "workshop",
    min_team_size: 1,
    max_team_size: 1,
    host_name: "AI Foundation",
    created_at: "2024-01-02T00:00:00Z",
  },
  {
    event_id: 3,
    title: "Blockchain Summit 2024",
    description: "Explore the future of blockchain technology and decentralized applications.",
    event_date: "2024-12-10T09:00:00Z",
    registration_deadline: "2024-12-05T23:59:59Z",
    capacity: 150,
    location: "Tech Hub, Silicon Valley",
    prize: "$15,000 + NFT Awards",
    event_type: "conference",
    min_team_size: 1,
    max_team_size: 1,
    host_name: "Blockchain Association",
    created_at: "2024-01-03T00:00:00Z",
  },
  {
    event_id: 4,
    title: "Robotics Challenge",
    description: "Build and program robots to complete exciting challenges.",
    event_date: "2024-11-30T10:00:00Z",
    registration_deadline: "2024-11-25T23:59:59Z",
    capacity: 30,
    location: "Engineering Hall, Room 101, Boston",
    prize: "$8,000 + Robotics Kit",
    event_type: "competition",
    min_team_size: 2,
    max_team_size: 4,
    host_name: "Robotics Club",
    created_at: "2024-01-04T00:00:00Z",
  },
  {
    event_id: 5,
    title: "Data Science Bootcamp",
    description: "Intensive 3-day bootcamp on machine learning and data visualization.",
    event_date: "2024-12-05T09:00:00Z",
    registration_deadline: "2024-12-01T23:59:59Z",
    capacity: 80,
    location: "Online (Zoom + Discord)",
    prize: "Certificate + Job Opportunities",
    event_type: "workshop",
    min_team_size: 1,
    max_team_size: 1,
    host_name: "Data Science Society",
    created_at: "2024-01-05T00:00:00Z",
  },
  {
    event_id: 6,
    title: "Startup Pitch Competition",
    description: "Pitch your startup idea to top investors and venture capitalists.",
    event_date: "2024-12-18T14:00:00Z",
    registration_deadline: "2024-12-10T23:59:59Z",
    capacity: 40,
    location: "Innovation Center, San Francisco",
    prize: "$25,000 Seed Funding",
    event_type: "competition",
    min_team_size: 1,
    max_team_size: 3,
    host_name: "Startup Hub",
    created_at: "2024-01-06T00:00:00Z",
  },
  {
    event_id: 7,
    title: "Web Development Hackathon",
    description: "Build full-stack web applications in 48 hours.",
    event_date: "2024-12-08T10:00:00Z",
    registration_deadline: "2024-12-01T23:59:59Z",
    capacity: 120,
    location: "Developer Hub, Downtown Austin",
    prize: "$12,000 + AWS Credits",
    event_type: "hackathon",
    min_team_size: 1,
    max_team_size: 4,
    host_name: "Web Dev Community",
    created_at: "2024-01-07T00:00:00Z",
  },
  {
    event_id: 8,
    title: "Cybersecurity Workshop",
    description: "Learn ethical hacking and security best practices.",
    event_date: "2024-11-28T13:00:00Z",
    registration_deadline: "2024-11-25T23:59:59Z",
    capacity: 60,
    location: "Security Lab, Seattle",
    prize: "Certificate + CTF Challenge",
    event_type: "workshop",
    min_team_size: 1,
    max_team_size: 1,
    host_name: "Cyber Security Alliance",
    created_at: "2024-01-08T00:00:00Z",
  },
  {
    event_id: 9,
    title: "Game Development Jam",
    description: "Create games in 48 hours using Unity or Unreal Engine.",
    event_date: "2024-12-12T09:00:00Z",
    registration_deadline: "2024-12-08T23:59:59Z",
    capacity: 75,
    location: "Gaming Arena, Los Angeles",
    prize: "$7,000 + Software Licenses",
    event_type: "hackathon",
    min_team_size: 2,
    max_team_size: 5,
    host_name: "Game Developers Guild",
    created_at: "2024-01-09T00:00:00Z",
  },
  {
    event_id: 10,
    title: "Cloud Computing Conference",
    description: "AWS, Azure, and Google Cloud expert sessions.",
    event_date: "2024-12-20T10:00:00Z",
    registration_deadline: "2024-12-15T23:59:59Z",
    capacity: 200,
    location: "Convention Center, Chicago",
    prize: "Cloud Credits ($5,000)",
    event_type: "conference",
    min_team_size: 1,
    max_team_size: 1,
    host_name: "Cloud Native Foundation",
    created_at: "2024-01-10T00:00:00Z",
  },
  {
    event_id: 11,
    title: "Mobile App Contest",
    description: "Develop innovative mobile applications for iOS and Android.",
    event_date: "2024-12-14T09:00:00Z",
    registration_deadline: "2024-12-10T23:59:59Z",
    capacity: 50,
    location: "Mobile Dev Lab, Miami",
    prize: "$10,000 + App Store Promotion",
    event_type: "competition",
    min_team_size: 1,
    max_team_size: 3,
    host_name: "Mobile Developers Association",
    created_at: "2024-01-11T00:00:00Z",
  },
  {
    event_id: 12,
    title: "DevOps Challenge",
    description: "Master CI/CD pipelines, Kubernetes, and Docker.",
    event_date: "2024-12-22T09:00:00Z",
    registration_deadline: "2024-12-18T23:59:59Z",
    capacity: 45,
    location: "Cloud Center, Denver",
    prize: "$5,000 + AWS Certification",
    event_type: "workshop",
    min_team_size: 2,
    max_team_size: 4,
    host_name: "DevOps Community",
    created_at: "2024-01-12T00:00:00Z",
  },
  {
    event_id: 13,
    title: "AR/VR Hackathon",
    description: "Build augmented and virtual reality experiences.",
    event_date: "2024-12-16T10:00:00Z",
    registration_deadline: "2024-12-12T23:59:59Z",
    capacity: 60,
    location: "VR Lab, Innovation Hub, Portland",
    prize: "$20,000 + VR Headsets",
    event_type: "hackathon",
    min_team_size: 1,
    max_team_size: 4,
    host_name: "XR Association",
    created_at: "2024-01-13T00:00:00Z",
  },
  {
    event_id: 14,
    title: "Quantum Computing Workshop",
    description: "Introduction to quantum algorithms and Qiskit.",
    event_date: "2025-01-10T10:00:00Z",
    registration_deadline: "2025-01-05T23:59:59Z",
    capacity: 40,
    location: "Physics Department, Cambridge",
    prize: "Certificate + Research Opportunity",
    event_type: "workshop",
    min_team_size: 1,
    max_team_size: 1,
    host_name: "Quantum Research Lab",
    created_at: "2024-01-14T00:00:00Z",
  },
  {
    event_id: 15,
    title: "FinTech Innovation Summit",
    description: "Future of financial technology and digital payments.",
    event_date: "2025-01-15T09:00:00Z",
    registration_deadline: "2025-01-10T23:59:59Z",
    capacity: 180,
    location: "Financial District, New York",
    prize: "$15,000 + Mentorship",
    event_type: "conference",
    min_team_size: 1,
    max_team_size: 1,
    host_name: "FinTech Alliance",
    created_at: "2024-01-15T00:00:00Z",
  },
  {
    event_id: 16,
    title: "IoT Smart City Challenge",
    description: "Build IoT solutions for smart city problems.",
    event_date: "2025-01-20T09:00:00Z",
    registration_deadline: "2025-01-15T23:59:59Z",
    capacity: 35,
    location: "IoT Lab, Singapore",
    prize: "$12,000 + Hardware Kit",
    event_type: "hackathon",
    min_team_size: 2,
    max_team_size: 5,
    host_name: "IoT Council",
    created_at: "2024-01-16T00:00:00Z",
  },
  {
    event_id: 17,
    title: "UI/UX Designathon",
    description: "Design user-centered interfaces and experiences.",
    event_date: "2025-01-25T10:00:00Z",
    registration_deadline: "2025-01-20T23:59:59Z",
    capacity: 55,
    location: "Design Studio, London",
    prize: "$6,000 + Design Software",
    event_type: "competition",
    min_team_size: 1,
    max_team_size: 3,
    host_name: "Designers Collective",
    created_at: "2024-01-17T00:00:00Z",
  },
  {
    event_id: 18,
    title: "Open Source Contribution Fest",
    description: "Contribute to open source projects and learn from maintainers.",
    event_date: "2024-12-01T09:00:00Z",
    registration_deadline: "2024-11-28T23:59:59Z",
    capacity: 500,
    location: "Online (GitHub + Discord)",
    prize: "Swag + GitHub Sponsorship",
    event_type: "workshop",
    min_team_size: 1,
    max_team_size: 1,
    host_name: "Open Source Initiative",
    created_at: "2024-01-18T00:00:00Z",
  },
  {
    event_id: 19,
    title: "Edge Computing Summit",
    description: "Explore edge computing, 5G, and distributed systems.",
    event_date: "2025-02-05T10:00:00Z",
    registration_deadline: "2025-01-30T23:59:59Z",
    capacity: 120,
    location: "Tech Conference Center, Berlin",
    prize: "$10,000 + Speaking Opportunity",
    event_type: "conference",
    min_team_size: 1,
    max_team_size: 1,
    host_name: "Edge Computing Alliance",
    created_at: "2024-01-19T00:00:00Z",
  },
  {
    event_id: 20,
    title: "Women in Tech Hackathon",
    description: "Empowering women in technology. Build solutions for social impact.",
    event_date: "2025-02-10T09:00:00Z",
    registration_deadline: "2025-02-05T23:59:59Z",
    capacity: 80,
    location: "Women's Tech Hub, Toronto",
    prize: "$15,000 + Mentorship Program",
    event_type: "hackathon",
    min_team_size: 1,
    max_team_size: 4,
    host_name: "Women Who Code",
    created_at: "2024-01-20T00:00:00Z",
  },
];

// Get events from localStorage or return default
export const getEvents = (): Event[] => {
  if (typeof window === 'undefined') return DEFAULT_MOCK_EVENTS;
  
  const stored = localStorage.getItem("globalEvents");
  if (stored) {
    return JSON.parse(stored) as Event[];
  }
  return DEFAULT_MOCK_EVENTS;
};

// Save events to localStorage
export const saveEvents = (events: Event[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem("globalEvents", JSON.stringify(events));
  localStorage.setItem("organizerEvents", JSON.stringify(events));
};

// Add a new event
export const addEvent = (event: Omit<Event, 'event_id' | 'created_at'>): Event[] => {
  const events = getEvents();
  const newEvent: Event = {
    ...event,
    event_id: Date.now(),
    created_at: new Date().toISOString(),
  };
  const updatedEvents: Event[] = [newEvent, ...events];
  saveEvents(updatedEvents);
  return updatedEvents;
};

// Delete an event
export const deleteEvent = (eventId: number): Event[] => {
  const events = getEvents();
  const updatedEvents: Event[] = events.filter((e: Event) => e.event_id !== eventId);
  saveEvents(updatedEvents);
  return updatedEvents;
};

// Update an event
export const updateEvent = (eventId: number, updatedData: Partial<Event>): Event[] => {
  const events = getEvents();
  const updatedEvents: Event[] = events.map((e: Event) => 
    e.event_id === eventId ? { ...e, ...updatedData } : e
  );
  saveEvents(updatedEvents);
  return updatedEvents;
};