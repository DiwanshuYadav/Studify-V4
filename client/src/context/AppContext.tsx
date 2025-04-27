import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Note, Event, Task, Message, StudyGroup, Post, TimerSession } from "../lib/types";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { DEFAULT_USER, SAMPLE_NOTES, SAMPLE_EVENTS, SAMPLE_TASKS, SAMPLE_MESSAGES, SAMPLE_STUDY_GROUPS, SAMPLE_POSTS, SAMPLE_TIMER_SESSIONS } from "../lib/constants";

interface AppContextProps {
  currentUser: User;
  notes: Note[];
  events: Event[];
  tasks: Task[];
  messages: Message[];
  studyGroups: StudyGroup[];
  posts: Post[];
  todayStudyTime: number;
  tasksCompleted: number;
  notesToday: number;
  updateUser: (user: Partial<User>) => void;
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  updateNote: (id: number, note: Partial<Note>) => void;
  deleteNote: (id: number) => void;
  addEvent: (event: Omit<Event, "id">) => void;
  updateEvent: (id: number, event: Partial<Event>) => void;
  deleteEvent: (id: number) => void;
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (id: number, task: Partial<Task>) => void;
  deleteTask: (id: number) => void;
  completeTask: (id: number) => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  createStudyGroup: (group: Omit<StudyGroup, "id" | "createdAt">) => void;
  joinStudyGroup: (groupId: number) => void;
  leaveStudyGroup: (groupId: number) => void;
  addPost: (post: Omit<Post, "id" | "timestamp">) => void;
  likePost: (postId: number) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useLocalStorage<User>("studify-user", DEFAULT_USER);
  const [notes, setNotes] = useLocalStorage<Note[]>("studify-notes", SAMPLE_NOTES);
  const [events, setEvents] = useLocalStorage<Event[]>("studify-events", SAMPLE_EVENTS);
  const [tasks, setTasks] = useLocalStorage<Task[]>("studify-tasks", SAMPLE_TASKS);
  const [messages, setMessages] = useLocalStorage<Message[]>("studify-messages", SAMPLE_MESSAGES);
  const [studyGroups, setStudyGroups] = useLocalStorage<StudyGroup[]>("studify-study-groups", SAMPLE_STUDY_GROUPS);
  const [posts, setPosts] = useLocalStorage<Post[]>("studify-posts", SAMPLE_POSTS);
  
  // Calculated stats
  const [todayStudyTime, setTodayStudyTime] = useState<number>(165); // 2h 45m in minutes
  const [tasksCompleted, setTasksCompleted] = useState<number>(0);
  const [notesToday, setNotesToday] = useState<number>(0);
  
  useEffect(() => {
    // Calculate tasks completed
    const completedCount = tasks.filter(task => task.completed).length;
    setTasksCompleted(completedCount);
    
    // Calculate notes created today
    const today = new Date().toDateString();
    const todayNotes = notes.filter(note => 
      new Date(note.createdAt).toDateString() === today
    ).length;
    setNotesToday(todayNotes);
  }, [tasks, notes]);

  const updateUser = (user: Partial<User>) => {
    setCurrentUser(prev => ({ ...prev, ...user }));
  };

  const addNote = (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    const newNote: Note = {
      ...note,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const updateNote = (id: number, note: Partial<Note>) => {
    setNotes(prev => 
      prev.map(n => 
        n.id === id ? { ...n, ...note, updatedAt: new Date().toISOString() } : n
      )
    );
  };

  const deleteNote = (id: number) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const addEvent = (event: Omit<Event, "id">) => {
    const newEvent: Event = {
      ...event,
      id: Date.now(),
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const updateEvent = (id: number, event: Partial<Event>) => {
    setEvents(prev => 
      prev.map(e => 
        e.id === id ? { ...e, ...event } : e
      )
    );
  };

  const deleteEvent = (id: number) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };

  const addTask = (task: Omit<Task, "id">) => {
    const newTask: Task = {
      ...task,
      id: Date.now(),
      completed: false,
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: number, task: Partial<Task>) => {
    setTasks(prev => 
      prev.map(t => 
        t.id === id ? { ...t, ...task } : t
      )
    );
  };

  const deleteTask = (id: number) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const completeTask = (id: number) => {
    setTasks(prev => 
      prev.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );
  };

  const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...message,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const createStudyGroup = (group: Omit<StudyGroup, "id" | "createdAt">) => {
    const newGroup: StudyGroup = {
      ...group,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      members: [currentUser.id],
    };
    setStudyGroups(prev => [...prev, newGroup]);
  };

  const joinStudyGroup = (groupId: number) => {
    setStudyGroups(prev => 
      prev.map(group => 
        group.id === groupId && !group.members.includes(currentUser.id)
          ? { ...group, members: [...group.members, currentUser.id] }
          : group
      )
    );
  };

  const leaveStudyGroup = (groupId: number) => {
    setStudyGroups(prev => 
      prev.map(group => 
        group.id === groupId
          ? { ...group, members: group.members.filter(id => id !== currentUser.id) }
          : group
      )
    );
  };

  const addPost = (post: Omit<Post, "id" | "timestamp">) => {
    const newPost: Post = {
      ...post,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const likePost = (postId: number) => {
    setPosts(prev => 
      prev.map(post => {
        if (post.id === postId) {
          const hasLiked = post.likes.includes(currentUser.id);
          return {
            ...post,
            likes: hasLiked
              ? post.likes.filter(id => id !== currentUser.id)
              : [...post.likes, currentUser.id],
          };
        }
        return post;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        notes,
        events,
        tasks,
        messages,
        studyGroups,
        posts,
        todayStudyTime,
        tasksCompleted,
        notesToday,
        updateUser,
        addNote,
        updateNote,
        deleteNote,
        addEvent,
        updateEvent,
        deleteEvent,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
        addMessage,
        createStudyGroup,
        joinStudyGroup,
        leaveStudyGroup,
        addPost,
        likePost,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
