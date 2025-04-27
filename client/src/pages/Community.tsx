import { useState } from 'react';
import Header from '../components/Header';
import { useAppContext } from '../context/AppContext';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Community = () => {
  const { posts, studyGroups, currentUser, addPost, likePost, createStudyGroup, joinStudyGroup } = useAppContext();
  const [isCreateStudyGroupOpen, setIsCreateStudyGroupOpen] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [newStudyGroup, setNewStudyGroup] = useState({
    name: '',
    description: '',
    subject: '',
    meetingTime: '',
    location: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewStudyGroup({
      ...newStudyGroup,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateStudyGroup = () => {
    if (newStudyGroup.name.trim() && newStudyGroup.description.trim()) {
      createStudyGroup({
        name: newStudyGroup.name,
        description: newStudyGroup.description,
        subject: newStudyGroup.subject,
        meetingTime: newStudyGroup.meetingTime,
        location: newStudyGroup.location,
        members: [currentUser.id],
      });
      
      // Create a post announcing the new study group
      addPost({
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        content: `I created a new study group: ${newStudyGroup.name}`,
        type: 'group',
        attachment: {
          title: newStudyGroup.name,
          description: newStudyGroup.description,
        },
      });
      
      setNewStudyGroup({
        name: '',
        description: '',
        subject: '',
        meetingTime: '',
        location: '',
      });
      
      setIsCreateStudyGroupOpen(false);
    }
  };

  const handleCreatePost = () => {
    if (newPost.trim()) {
      addPost({
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        content: newPost,
        type: 'text',
        attachment: null,
      });
      
      setNewPost('');
    }
  };

  const handleLike = (postId: number) => {
    likePost(postId);
  };

  const handleJoinGroup = (groupId: number) => {
    joinStudyGroup(groupId);
  };

  // Sort posts and groups by recency
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const sortedGroups = [...studyGroups].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#F5F5F7]">
      <Header title="Community" />
      
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Tabs defaultValue="feed">
          <TabsList className="mb-6">
            <TabsTrigger value="feed">Activity Feed</TabsTrigger>
            <TabsTrigger value="groups">Study Groups</TabsTrigger>
          </TabsList>
          
          <TabsContent value="feed">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="bg-white rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)] p-5">
                  <div className="flex items-center p-3 border border-[#F5F5F7] rounded-xl mb-6">
                    <img 
                      className="w-10 h-10 rounded-full object-cover" 
                      src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random`} 
                      alt="Your avatar" 
                    />
                    <div className="ml-3 flex-1">
                      <Textarea
                        placeholder="Share something with your study community..."
                        className="min-h-[80px] border-none focus:ring-0 p-0 resize-none"
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex space-x-2">
                      <button className="text-sm text-gray-500 flex items-center">
                        <i className="fa-solid fa-image mr-1"></i> Image
                      </button>
                      <button className="text-sm text-gray-500 flex items-center">
                        <i className="fa-solid fa-paperclip mr-1"></i> File
                      </button>
                      <button className="text-sm text-gray-500 flex items-center">
                        <i className="fa-solid fa-note-sticky mr-1"></i> Note
                      </button>
                    </div>
                    <Button 
                      className="bg-secondary hover:bg-blue-600"
                      disabled={!newPost.trim()}
                      onClick={handleCreatePost}
                    >
                      Post
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {sortedPosts.map((post) => (
                      <div key={post.id} className="border-t border-[#F5F5F7] pt-6">
                        <div className="flex">
                          <img 
                            className="w-10 h-10 rounded-full object-cover" 
                            src={post.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.userName)}&background=random`} 
                            alt={`${post.userName}'s avatar`} 
                          />
                          <div className="ml-3 flex-1">
                            <div className="bg-[#F5F5F7] rounded-xl p-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-medium">
                                    {post.userName} 
                                    {post.type === 'note' && <span className="text-gray-500 font-normal"> shared a note</span>}
                                    {post.type === 'group' && <span className="text-gray-500 font-normal"> created a study group</span>}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="mt-2">
                                {post.content && (
                                  <p className="text-sm">{post.content}</p>
                                )}
                                
                                {post.attachment && post.type === 'note' && (
                                  <div className="border border-[#F5F5F7] rounded-xl p-3 bg-white mt-2">
                                    <p className="text-sm font-medium">{post.attachment.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">{post.attachment.description}</p>
                                  </div>
                                )}
                                
                                {post.attachment && post.type === 'group' && (
                                  <div className="border border-[#F5F5F7] rounded-xl p-3 bg-white mt-2">
                                    <p className="text-sm font-medium">{post.attachment.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">{post.attachment.description}</p>
                                    <button className="mt-2 text-xs bg-secondary text-white rounded-full px-3 py-1 hover:bg-blue-600 transition-apple">
                                      Join Group
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center mt-2 space-x-4 px-2">
                              <button 
                                className={`text-sm ${post.likes.includes(currentUser.id) ? 'text-secondary' : 'text-gray-500 hover:text-secondary'} flex items-center`}
                                onClick={() => handleLike(post.id)}
                              >
                                <i className={`${post.likes.includes(currentUser.id) ? 'fa-solid' : 'fa-regular'} fa-heart mr-1`}></i> 
                                {post.likes.length > 0 && post.likes.length} Like{post.likes.length !== 1 && 's'}
                              </button>
                              <button className="text-sm text-gray-500 hover:text-secondary flex items-center">
                                <i className="fa-regular fa-comment mr-1"></i> Comment
                              </button>
                              <button className="text-sm text-gray-500 hover:text-secondary flex items-center">
                                <i className="fa-solid fa-share mr-1"></i> Share
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-white rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)] p-5">
                  <h3 className="text-lg font-semibold mb-4">Trending Topics</h3>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-[#F5F5F7] rounded-xl">
                      <div className="flex items-center text-sm font-medium text-secondary">
                        <span>#MachineLearning</span>
                        <span className="ml-auto text-xs text-gray-500">128 posts</span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-[#F5F5F7] rounded-xl">
                      <div className="flex items-center text-sm font-medium text-secondary">
                        <span>#FinalExams</span>
                        <span className="ml-auto text-xs text-gray-500">87 posts</span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-[#F5F5F7] rounded-xl">
                      <div className="flex items-center text-sm font-medium text-secondary">
                        <span>#ResearchMethods</span>
                        <span className="ml-auto text-xs text-gray-500">64 posts</span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-[#F5F5F7] rounded-xl">
                      <div className="flex items-center text-sm font-medium text-secondary">
                        <span>#StudyHacks</span>
                        <span className="ml-auto text-xs text-gray-500">53 posts</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)] p-5 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Suggested Connections</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <img 
                        className="w-10 h-10 rounded-full object-cover" 
                        src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80" 
                        alt="User avatar" 
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium">David Kim</p>
                        <p className="text-xs text-gray-500">Computer Science</p>
                      </div>
                      <button className="ml-auto text-xs border border-secondary text-secondary hover:bg-blue-50 px-3 py-1 rounded-full">
                        Connect
                      </button>
                    </div>
                    
                    <div className="flex items-center">
                      <img 
                        className="w-10 h-10 rounded-full object-cover" 
                        src="https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80" 
                        alt="User avatar" 
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium">Sarah Thompson</p>
                        <p className="text-xs text-gray-500">Physics</p>
                      </div>
                      <button className="ml-auto text-xs border border-secondary text-secondary hover:bg-blue-50 px-3 py-1 rounded-full">
                        Connect
                      </button>
                    </div>
                    
                    <div className="flex items-center">
                      <img 
                        className="w-10 h-10 rounded-full object-cover" 
                        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80" 
                        alt="User avatar" 
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium">Michael Rodriguez</p>
                        <p className="text-xs text-gray-500">Mathematics</p>
                      </div>
                      <button className="ml-auto text-xs border border-secondary text-secondary hover:bg-blue-50 px-3 py-1 rounded-full">
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="groups">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Study Groups</h3>
              <Button 
                className="bg-secondary hover:bg-blue-600"
                onClick={() => setIsCreateStudyGroupOpen(true)}
              >
                <i className="fa-solid fa-plus mr-2"></i> Create Group
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sortedGroups.map((group) => (
                <div key={group.id} className="bg-white rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)] overflow-hidden">
                  <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  <div className="p-5">
                    <h4 className="text-lg font-semibold">{group.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                    
                    <div className="mt-4 space-y-2">
                      {group.subject && (
                        <div className="flex items-center text-sm">
                          <i className="fa-solid fa-book text-secondary w-5"></i>
                          <span>{group.subject}</span>
                        </div>
                      )}
                      
                      {group.meetingTime && (
                        <div className="flex items-center text-sm">
                          <i className="fa-solid fa-clock text-secondary w-5"></i>
                          <span>{group.meetingTime}</span>
                        </div>
                      )}
                      
                      {group.location && (
                        <div className="flex items-center text-sm">
                          <i className="fa-solid fa-location-dot text-secondary w-5"></i>
                          <span>{group.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm">
                        <i className="fa-solid fa-users text-secondary w-5"></i>
                        <span>{group.members.length} members</span>
                      </div>
                    </div>
                    
                    <div className="mt-5">
                      {group.members.includes(currentUser.id) ? (
                        <Button className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200">
                          Already Joined
                        </Button>
                      ) : (
                        <Button 
                          className="w-full bg-secondary hover:bg-blue-600"
                          onClick={() => handleJoinGroup(group.id)}
                        >
                          Join Group
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isCreateStudyGroupOpen} onOpenChange={setIsCreateStudyGroupOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Create Study Group</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name</Label>
              <Input 
                id="name" 
                name="name"
                value={newStudyGroup.name}
                onChange={handleInputChange}
                placeholder="Enter group name" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                name="subject"
                value={newStudyGroup.subject}
                onChange={handleInputChange}
                placeholder="E.g. Mathematics, Physics, Computer Science" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description"
                value={newStudyGroup.description}
                onChange={handleInputChange}
                placeholder="What will your group be studying?"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="meetingTime">Meeting Time (optional)</Label>
              <Input 
                id="meetingTime" 
                name="meetingTime"
                value={newStudyGroup.meetingTime}
                onChange={handleInputChange}
                placeholder="E.g. Tuesdays and Thursdays at 6 PM" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input 
                id="location" 
                name="location"
                value={newStudyGroup.location}
                onChange={handleInputChange}
                placeholder="E.g. Library, Room 203, Online" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateStudyGroupOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateStudyGroup}>Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Community;
