import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Header from '../components/Header';
import { useParams, useLocation } from 'wouter';

const Profile = () => {
  const { currentUser, updateUser, notes, studyGroups } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    major: currentUser.major,
    bio: currentUser.bio || '',
  });
  const [activeTab, setActiveTab] = useState<'notes' | 'groups' | 'activity'>('notes');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(formData);
    setIsEditing(false);
  };
  
  // Stats
  const totalNotes = notes.length;
  const completedTasks = 5; // Would come from tasks data
  const userGroups = studyGroups.filter(group => group.members.includes(currentUser.id));
  
  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#F5F5F7]">
      <Header title="Profile" />
      
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)] overflow-hidden mb-6">
          <div className="h-40 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <div className="p-6 relative">
            <div className="absolute -top-16 left-6">
              <img 
                src={currentUser.avatar} 
                alt={`${currentUser.name}'s profile`}
                className="w-32 h-32 rounded-full border-4 border-white object-cover"
              />
            </div>
            
            <div className="mt-16 sm:mt-0 sm:ml-36">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                  <p className="text-gray-600">{currentUser.major}</p>
                </div>
                
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="mt-3 sm:mt-0 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-600 transition-apple"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="mt-3 sm:mt-0 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-apple"
                  >
                    Cancel
                  </button>
                )}
              </div>
              
              <p className="mt-3 text-gray-600">
                {currentUser.bio || "No bio available. Add some information about yourself!"}
              </p>
              
              <div className="mt-4 flex space-x-4">
                <div>
                  <span className="font-semibold">{currentUser.followers.length}</span> Followers
                </div>
                <div>
                  <span className="font-semibold">{currentUser.following.length}</span> Following
                </div>
                <div>
                  <span className="font-semibold">{userGroups.length}</span> Groups
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Profile Edit Form */}
        {isEditing && (
          <div className="bg-white rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)] p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Edit Profile</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
                  <input 
                    type="text" 
                    name="major" 
                    value={formData.major} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
                  <input 
                    type="text" 
                    name="avatar"
                    defaultValue={currentUser.avatar}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea 
                    name="bio" 
                    value={formData.bio} 
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button 
                  type="submit"
                  className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-600 transition-apple"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mr-4">
                <i className="fa-solid fa-note-sticky text-secondary text-xl"></i>
              </div>
              <div>
                <h4 className="text-xl font-semibold">{totalNotes}</h4>
                <p className="text-gray-500 text-sm">Notes Created</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mr-4">
                <i className="fa-solid fa-check text-green-500 text-xl"></i>
              </div>
              <div>
                <h4 className="text-xl font-semibold">{completedTasks}</h4>
                <p className="text-gray-500 text-sm">Tasks Completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mr-4">
                <i className="fa-solid fa-users text-purple-500 text-xl"></i>
              </div>
              <div>
                <h4 className="text-xl font-semibold">{userGroups.length}</h4>
                <p className="text-gray-500 text-sm">Study Groups</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Tabs */}
        <div className="bg-white rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)] overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                className={`px-6 py-4 text-sm font-medium ${activeTab === 'notes' ? 'text-secondary border-b-2 border-secondary' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('notes')}
              >
                My Notes
              </button>
              <button
                className={`px-6 py-4 text-sm font-medium ${activeTab === 'groups' ? 'text-secondary border-b-2 border-secondary' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('groups')}
              >
                Study Groups
              </button>
              <button
                className={`px-6 py-4 text-sm font-medium ${activeTab === 'activity' ? 'text-secondary border-b-2 border-secondary' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('activity')}
              >
                Recent Activity
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'notes' && (
              <div>
                {notes.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fa-solid fa-folder-open text-4xl text-gray-300 mb-2"></i>
                    <p className="text-gray-500">You haven't created any notes yet.</p>
                    <button className="mt-3 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-600 transition-apple">
                      Create Your First Note
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notes.map(note => (
                      <div key={note.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-apple">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">{note.title}</h3>
                          <span className="badge bg-blue-100 text-secondary">{note.subject}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{note.content}</p>
                        <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                          <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
                          <div className="flex items-center">
                            <i className="fa-solid fa-paperclip mr-1"></i> {note.attachments}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'groups' && (
              <div>
                {userGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fa-solid fa-user-group text-4xl text-gray-300 mb-2"></i>
                    <p className="text-gray-500">You're not part of any study groups yet.</p>
                    <button className="mt-3 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-600 transition-apple">
                      Explore Study Groups
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userGroups.map(group => (
                      <div key={group.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-apple">
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                        <div className="mt-3 flex items-center">
                          <i className="fa-solid fa-users text-gray-400 mr-2"></i>
                          <span className="text-sm">{group.members.length} members</span>
                        </div>
                        {group.meetingTime && (
                          <div className="mt-1 flex items-center">
                            <i className="fa-solid fa-clock text-gray-400 mr-2"></i>
                            <span className="text-sm">{group.meetingTime}</span>
                          </div>
                        )}
                        {group.location && (
                          <div className="mt-1 flex items-center">
                            <i className="fa-solid fa-location-dot text-gray-400 mr-2"></i>
                            <span className="text-sm">{group.location}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-apple">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-note-sticky text-secondary"></i>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">You</span> created a note <span className="font-medium text-secondary">Machine Learning Models</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-apple">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-check text-green-500"></i>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">You</span> completed a task <span className="font-medium text-green-500">Complete calculus homework</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">3 days ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-apple">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-users text-purple-500"></i>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">You</span> joined the study group <span className="font-medium text-purple-500">Machine Learning Study Circle</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">1 week ago</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;