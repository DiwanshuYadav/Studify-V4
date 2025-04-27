import { useState } from 'react';
import Header from '../components/Header';
import { useAppContext } from '../context/AppContext';
import NoteCard from '../components/notes/NoteCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Notes = () => {
  const { notes, addNote } = useAppContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeSubject, setActiveSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    subject: '',
    attachments: 0,
    sharedWith: 0
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewNote({
      ...newNote,
      [e.target.name]: e.target.value
    });
  };

  const handleSubjectChange = (value: string) => {
    setNewNote({
      ...newNote,
      subject: value
    });
  };

  const handleCreateNote = () => {
    if (newNote.title.trim() && newNote.content.trim() && newNote.subject) {
      addNote({
        title: newNote.title,
        content: newNote.content,
        subject: newNote.subject,
        attachments: 0,
        sharedWith: 0
      });
      
      setNewNote({
        title: '',
        content: '',
        subject: '',
        attachments: 0,
        sharedWith: 0
      });
      
      setIsCreateModalOpen(false);
    }
  };

  // Get unique subjects for filter
  const subjects = ['all', ...Array.from(new Set(notes.map(note => note.subject)))];

  // Filter notes by subject and search query
  const filteredNotes = notes.filter(note => {
    const matchesSubject = activeSubject === 'all' || note.subject === activeSubject;
    const matchesSearch = !searchQuery || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSubject && matchesSearch;
  });

  // Sort notes by date updated
  const sortedNotes = [...filteredNotes].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#F5F5F7]">
      <Header title="Notes" />
      
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)] p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search notes..." 
                  className="w-full px-4 py-2 pl-10 rounded-xl bg-[#F5F5F7] border-none focus:ring-2 focus:ring-secondary focus:outline-none transition-apple" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>
            <Button 
              className="bg-secondary hover:bg-blue-600 text-white"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <i className="fa-solid fa-plus mr-2"></i> Create Note
            </Button>
          </div>
          
          <Tabs defaultValue="all" value={activeSubject} onValueChange={setActiveSubject}>
            <TabsList className="mb-4 flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <TabsTrigger 
                  key={subject} 
                  value={subject}
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-secondary"
                >
                  {subject === 'all' ? 'All Notes' : subject}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={activeSubject} className="mt-0">
              {sortedNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedNotes.map(note => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-secondary mb-4">
                    <i className="fa-solid fa-note-sticky text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-medium">No notes found</h3>
                  <p className="text-gray-500 mt-2">
                    {searchQuery 
                      ? "Try a different search query" 
                      : "Create your first note to get started"
                    }
                  </p>
                  <Button 
                    className="mt-4 bg-secondary hover:bg-blue-600"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    Create Note
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Note</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                name="title"
                value={newNote.title}
                onChange={handleInputChange}
                placeholder="Note title" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Select onValueChange={handleSubjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="Literature">Literature</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea 
                id="content" 
                name="content"
                value={newNote.content}
                onChange={handleInputChange}
                placeholder="Write your note content here..."
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateNote}>Create Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;
