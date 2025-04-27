import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import NoteCard from './NoteCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RecentNotes = () => {
  const { notes, addNote } = useAppContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  const recentNotes = [...notes].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)] p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold">Recent Notes</h3>
        <a href="/notes" className="text-secondary text-sm font-medium hover:underline">
          View All
        </a>
      </div>
      
      <div className="space-y-4">
        {recentNotes.map(note => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
      
      <button 
        className="w-full mt-4 py-2 border border-[#F5F5F7] rounded-xl text-sm font-medium text-gray-600 hover:bg-[#F5F5F7] transition-apple"
        onClick={() => setIsCreateModalOpen(true)}
      >
        Create New Note
      </button>

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
                className="min-h-[120px]"
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

export default RecentNotes;
