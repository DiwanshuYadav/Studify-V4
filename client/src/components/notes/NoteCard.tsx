import { useState } from 'react';
import { Note } from '../../lib/types';
import { formatDistanceToNow } from 'date-fns';
import { useAppContext } from '../../context/AppContext';

interface NoteCardProps {
  note: Note;
}

const NoteCard = ({ note }: NoteCardProps) => {
  const { deleteNote } = useAppContext();
  const [showMenu, setShowMenu] = useState(false);

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      'Computer Science': 'bg-blue-100 text-secondary',
      'Mathematics': 'bg-green-100 text-accent',
      'Physics': 'bg-purple-100 text-purple-600',
      'Chemistry': 'bg-yellow-100 text-yellow-600',
      'Biology': 'bg-red-100 text-red-600',
      'Literature': 'bg-pink-100 text-pink-600',
      'History': 'bg-orange-100 text-orange-600',
    };
    
    return colors[subject] || 'bg-gray-100 text-gray-600';
  };

  const getTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const handleToggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <div className="border border-[#F5F5F7] rounded-xl p-4 hover:shadow-sm transition-apple cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center">
            <span className={`text-xs font-medium px-2 py-1 ${getSubjectColor(note.subject)} rounded-full`}>
              {note.subject}
            </span>
            <span className="text-xs text-gray-500 ml-2">Updated {getTimeAgo(note.updatedAt)}</span>
          </div>
          <h4 className="font-medium mt-2">{note.title}</h4>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{note.content}</p>
        </div>
        <div className="relative">
          <button 
            className="text-gray-400 hover:text-gray-600 p-1"
            onClick={handleToggleMenu}
          >
            <i className="fa-solid fa-ellipsis-vertical"></i>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-[#F5F5F7] z-10">
              <ul className="py-1">
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-secondary">
                    Edit
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-secondary">
                    Share
                  </button>
                </li>
                <li>
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => deleteNote(note.id)}
                  >
                    Delete
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center mt-3 text-sm text-gray-500">
        <span className="flex items-center">
          <i className="fa-solid fa-paperclip mr-1"></i> {note.attachments} attachment{note.attachments !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center ml-4">
          <i className="fa-solid fa-share-nodes mr-1"></i> Shared with {note.sharedWith} {note.sharedWith === 1 ? 'person' : 'people'}
        </span>
      </div>
    </div>
  );
};

export default NoteCard;
