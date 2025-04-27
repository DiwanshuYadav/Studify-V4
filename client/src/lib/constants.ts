import { User, Note, Event, Task, Message, StudyGroup, Post } from './types';

// Default user data
export const DEFAULT_USER: User = {
  id: 0,
  name: 'Emma Watson',
  username: 'emmawatson',
  email: 'emma@example.com',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
  major: 'Computer Science',
  bio: 'Studying Computer Science with a focus on machine learning and AI.',
  createdAt: new Date().toISOString(),
  followers: [1, 2, 3],
  following: [1, 2, 4, 5]
};

// Sample notes data
export const SAMPLE_NOTES: Note[] = [
  {
    id: 1,
    title: 'Data Structures and Algorithms',
    subject: 'Computer Science',
    content: 'Notes on binary trees, graph traversal algorithms, and time complexity analysis of sorting algorithms.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    attachments: 3,
    sharedWith: 2
  },
  {
    id: 2,
    title: 'Linear Algebra Fundamentals',
    subject: 'Mathematics',
    content: 'Vector spaces, linear transformations, eigenvalues and eigenvectors. Key concepts for machine learning applications.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    attachments: 1,
    sharedWith: 5
  },
  {
    id: 3,
    title: 'Quantum Mechanics',
    subject: 'Physics',
    content: 'Wave functions, Schrödinger equation, and quantum entanglement. Preparing for midterm examination.',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    attachments: 2,
    sharedWith: 1
  },
  {
    id: 4,
    title: 'Organic Chemistry Reactions',
    subject: 'Chemistry',
    content: 'Detailed notes on addition, elimination, and substitution reactions in organic compounds.',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    attachments: 4,
    sharedWith: 3
  },
  {
    id: 5,
    title: 'Machine Learning Models',
    subject: 'Computer Science',
    content: 'Comparison of regression, classification, and clustering algorithms. Implementations in Python with TensorFlow.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    attachments: 2,
    sharedWith: 4
  }
];

// Sample events data
export const SAMPLE_EVENTS: Event[] = [
  {
    id: 1,
    title: 'Calculus Lecture',
    type: 'lecture',
    start: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(11, 30, 0, 0)).toISOString()
  },
  {
    id: 2,
    title: 'Study Group: Computer Science',
    type: 'studyGroup',
    start: new Date(new Date().setHours(13, 0, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(14, 30, 0, 0)).toISOString()
  },
  {
    id: 3,
    title: 'Assignment Deadline: Physics',
    type: 'assignment',
    start: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(15, 0, 0, 0)).toISOString()
  },
  {
    id: 4,
    title: 'Research Project Meeting',
    type: 'meeting',
    start: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(17, 0, 0, 0)).toISOString()
  },
  {
    id: 5,
    title: 'Advanced Algorithms Lecture',
    type: 'lecture',
    start: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);
      return date.toISOString();
    })(),
    end: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      date.setHours(10, 30, 0, 0);
      return date.toISOString();
    })()
  },
  {
    id: 6,
    title: 'Midterm Exam: Mathematics',
    type: 'exam',
    start: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 2);
      date.setHours(14, 0, 0, 0);
      return date.toISOString();
    })(),
    end: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 2);
      date.setHours(16, 0, 0, 0);
      return date.toISOString();
    })()
  }
];

// Sample tasks data
export const SAMPLE_TASKS: Task[] = [
  {
    id: 1,
    title: 'Complete calculus homework',
    description: 'Problems 1-10 from Chapter 5',
    dueDate: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return date.toISOString();
    })(),
    priority: 'high',
    completed: true
  },
  {
    id: 2,
    title: 'Prepare presentation for research project',
    description: 'Slides on recent findings and future directions',
    dueDate: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 3);
      return date.toISOString();
    })(),
    priority: 'medium',
    completed: false
  },
  {
    id: 3,
    title: 'Review lecture notes for midterm',
    description: 'Focus on chapters 1-7',
    dueDate: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 5);
      return date.toISOString();
    })(),
    priority: 'high',
    completed: false
  },
  {
    id: 4,
    title: 'Submit physics lab report',
    description: 'Include all data tables and analysis',
    dueDate: (() => {
      const date = new Date();
      date.setHours(23, 59, 59, 0);
      return date.toISOString();
    })(),
    priority: 'high',
    completed: true
  },
  {
    id: 5,
    title: 'Meet with academic advisor',
    dueDate: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date.toISOString();
    })(),
    priority: 'low',
    completed: false
  }
];

// Sample messages data
export const SAMPLE_MESSAGES: Message[] = [
  {
    id: 1,
    senderId: 1, // Alex Chen
    receiverId: 0, // Current user (Emma)
    content: "Hey! How's your studying going?",
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
  },
  {
    id: 2,
    senderId: 0, // Current user (Emma)
    receiverId: 1, // Alex Chen
    content: "Pretty good! Working on those ML algorithms.",
    timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString() // 55 minutes ago
  },
  {
    id: 3,
    senderId: 1, // Alex Chen
    receiverId: 0, // Current user (Emma)
    content: "Want to join our study group for the final?",
    timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString() // 50 minutes ago
  },
  {
    id: 4,
    senderId: 0, // Current user (Emma)
    receiverId: 1, // Alex Chen
    content: "That sounds great! When and where?",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45 minutes ago
  },
  {
    id: 5,
    senderId: 1, // Alex Chen
    receiverId: 0, // Current user (Emma)
    content: "Library, room 204, tomorrow at 6PM. We'll be going over neural networks.",
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString() // 40 minutes ago
  },
  {
    id: 6,
    senderId: 2, // Sophia Williams
    receiverId: 0, // Current user (Emma)
    content: "Hi Emma! Did you finish the physics assignment yet?",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
  },
  {
    id: 7,
    senderId: 0, // Current user (Emma)
    receiverId: 2, // Sophia Williams
    content: "Almost! I'm stuck on problem 7. Have you done it?",
    timestamp: new Date(Date.now() - 2.8 * 60 * 60 * 1000).toISOString() // 2.8 hours ago
  },
  {
    id: 8,
    senderId: 2, // Sophia Williams
    receiverId: 0, // Current user (Emma)
    content: "Yes, I can help you with it. It involves conservation of momentum.",
    timestamp: new Date(Date.now() - 2.7 * 60 * 60 * 1000).toISOString() // 2.7 hours ago
  }
];

// Sample study groups data
export const SAMPLE_STUDY_GROUPS: StudyGroup[] = [
  {
    id: 1,
    name: 'Machine Learning Study Circle',
    description: 'Weekly discussions on ML algorithms, techniques, and applications',
    subject: 'Computer Science',
    meetingTime: 'Tuesdays and Thursdays at 6 PM',
    location: 'Library, Room 204',
    members: [0, 1, 3, 5],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
  },
  {
    id: 2,
    name: 'Advanced Statistics Group',
    description: 'Preparing for the final exam. Join us every Tuesday and Thursday at 6 PM in the library.',
    subject: 'Mathematics',
    meetingTime: 'Mondays at 5 PM',
    location: 'Math Building, Room 103',
    members: [2, 4, 5],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
  },
  {
    id: 3,
    name: 'Quantum Physics Discussion',
    description: 'Deep dive into quantum mechanics concepts and problem-solving',
    subject: 'Physics',
    meetingTime: 'Wednesdays at 7 PM',
    location: 'Physics Lab',
    members: [1, 2, 3],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  }
];

// Sample posts data
export const SAMPLE_POSTS: Post[] = [
  {
    id: 1,
    userId: 1,
    userName: 'Alex Chen',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
    content: '',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    type: 'note',
    attachment: {
      title: 'Machine Learning: Neural Networks',
      description: 'These are my notes from yesterday\'s lecture. Contains implementation details for backpropagation and activation functions.'
    },
    likes: [0, 2], // Current user (Emma) has liked this post
    comments: []
  },
  {
    id: 2,
    userId: 2,
    userName: 'Sophia Williams',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
    content: '',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    type: 'group',
    attachment: {
      title: 'Advanced Statistics Group',
      description: 'Preparing for the final exam. Join us every Tuesday and Thursday at 6 PM in the library.'
    },
    likes: [1, 3, 4],
    comments: []
  },
  {
    id: 3,
    userId: 3,
    userName: 'David Kim',
    userAvatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
    content: 'Just finished my research project on renewable energy! Anyone interested in sustainable technology?',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    type: 'text',
    attachment: null,
    likes: [0, 2, 5], // Current user (Emma) has liked this post
    comments: []
  },
  {
    id: 4,
    userId: 4,
    userName: 'Sarah Thompson',
    userAvatar: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
    content: 'Looking for study partners for the upcoming calculus exam. Anyone want to form a group?',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    type: 'text',
    attachment: null,
    likes: [1, 2],
    comments: []
  }
];
