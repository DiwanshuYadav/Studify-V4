import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const CommunityActivity = () => {
  const { posts, currentUser, addPost, likePost } = useAppContext();
  const [newPostContent, setNewPostContent] = useState('');

  const handleCreatePost = () => {
    if (newPostContent.trim()) {
      addPost({
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        content: newPostContent,
        type: 'text',
        attachment: null,
      });
      
      setNewPostContent('');
    }
  };

  const handleLike = (postId: number) => {
    likePost(postId);
  };

  // Sort posts by timestamp, newest first
  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);

  return (
    <section className="mt-6">
      <div className="bg-white rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)] p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">Community Activity</h3>
          <a href="/community" className="text-secondary text-sm font-medium hover:underline">
            View Full Feed
          </a>
        </div>
        
        <div className="space-y-5">
          {recentPosts.map((post) => (
            <div key={post.id} className="flex">
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
          ))}
        </div>
        
        <div className="mt-4 flex items-center border border-[#F5F5F7] rounded-xl p-2 focus-within:border-secondary bg-white">
          <img 
            className="w-8 h-8 rounded-full object-cover" 
            src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random`} 
            alt="Your avatar" 
          />
          <input 
            type="text" 
            placeholder="Share something with your study community..." 
            className="flex-1 border-none bg-transparent text-sm p-2 focus:outline-none focus:ring-0"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCreatePost();
              }
            }}
          />
          <button 
            className="text-secondary hover:text-blue-600 px-2"
            onClick={handleCreatePost}
            disabled={!newPostContent.trim()}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CommunityActivity;
