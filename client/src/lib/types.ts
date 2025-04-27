// User Types
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar: string;
  major: string;
  bio?: string;
  createdAt: string;
  followers: number[];
  following: number[];
}

// Note Types
export interface Note {
  id: number;
  title: string;
  content: string;
  subject: string;
  attachments: number;
  sharedWith: number;
  createdAt: string;
  updatedAt: string;
}

// Event Types
export interface Event {
  id: number;
  title: string;
  type: 'lecture' | 'studyGroup' | 'assignment' | 'meeting' | 'exam';
  start: string;
  end: string;
}

// Task Types
export interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  completed: boolean;
}

// Message Types
export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
}

// Study Group Types
export interface StudyGroup {
  id: number;
  name: string;
  description: string;
  subject?: string;
  meetingTime?: string;
  location?: string;
  members: number[];
  createdAt: string;
}

// Social Post Types
export interface Post {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  type: 'text' | 'note' | 'group';
  attachment: {
    title: string;
    description: string;
  } | null;
  likes: number[];
  comments: PostComment[];
}

export interface PostComment {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
}

// Timer Types
export interface TimerSession {
  id: number;
  userId: number;
  type: 'focus' | 'shortBreak' | 'longBreak';
  duration: number;
  startTime: string;
  endTime?: string;
  completed: boolean;
}

// Study Stats
export interface StudyStats {
  totalTimeToday: number;
  totalSessions: number;
  completedTasks: number;
  notesCreated: number;
}
