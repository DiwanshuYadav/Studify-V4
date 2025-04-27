import { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ClientSettings } from '../../lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

const defaultSettings: ClientSettings = {
  theme: 'light',
  notificationsEnabled: true,
  soundsEnabled: true,
  autoJoinCalls: false,
  privacy: 'public',
  fontSize: 'medium',
};

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { currentUser } = useAppContext();
  const [settings, setSettings] = useState<ClientSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState('general');
  const { toast } = useToast();

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        
        // Apply theme immediately
        if (parsedSettings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (parsedSettings.theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else if (parsedSettings.theme === 'system') {
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        
        // Apply font size immediately
        const fontSize = parsedSettings.fontSize;
        if (fontSize === 'small') {
          document.documentElement.style.fontSize = '14px';
        } else if (fontSize === 'medium') {
          document.documentElement.style.fontSize = '16px';
        } else if (fontSize === 'large') {
          document.documentElement.style.fontSize = '18px';
        }
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
  }, []);

  const handleSaveSettings = () => {
    // Save settings to localStorage
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated",
    });
  };

  const handleLogout = () => {
    // Clear user data and redirect to login page
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setSettings(prev => ({ ...prev, theme }));
    
    // Apply theme immediately
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (theme === 'system') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handlePrivacyChange = (privacy: 'public' | 'private' | 'friends') => {
    setSettings(prev => ({ ...prev, privacy }));
  };

  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    setSettings(prev => ({ ...prev, fontSize }));
    
    // Apply font size immediately
    const htmlElement = document.documentElement;
    
    if (fontSize === 'small') {
      htmlElement.style.fontSize = '14px';
    } else if (fontSize === 'medium') {
      htmlElement.style.fontSize = '16px';
    } else if (fontSize === 'large') {
      htmlElement.style.fontSize = '18px';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <div>
              <h3 className="font-medium text-base mb-2">Theme</h3>
              <RadioGroup 
                value={settings.theme} 
                onValueChange={(value) => handleThemeChange(value as 'light' | 'dark' | 'system')}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="theme-light" />
                  <Label htmlFor="theme-light">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  <Label htmlFor="theme-dark">Dark</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="theme-system" />
                  <Label htmlFor="theme-system">System</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <h3 className="font-medium text-base mb-2">Font Size</h3>
              <RadioGroup 
                value={settings.fontSize} 
                onValueChange={(value) => handleFontSizeChange(value as 'small' | 'medium' | 'large')}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="small" id="font-small" />
                  <Label htmlFor="font-small">Small</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="font-medium" />
                  <Label htmlFor="font-medium">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="large" id="font-large" />
                  <Label htmlFor="font-large">Large</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Sounds</h3>
                <p className="text-sm text-gray-500">Enable sound effects</p>
              </div>
              <Switch 
                checked={settings.soundsEnabled} 
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, soundsEnabled: checked }))}
              />
            </div>
          </TabsContent>
          
          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Enable Notifications</h3>
                <p className="text-sm text-gray-500">Receive app notifications</p>
              </div>
              <Switch 
                checked={settings.notificationsEnabled} 
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notificationsEnabled: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Auto Join Calls</h3>
                <p className="text-sm text-gray-500">Automatically join video calls</p>
              </div>
              <Switch 
                checked={settings.autoJoinCalls} 
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoJoinCalls: checked }))}
              />
            </div>
          </TabsContent>
          
          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-4">
            <div>
              <h3 className="font-medium text-base mb-2">Privacy Level</h3>
              <RadioGroup 
                value={settings.privacy} 
                onValueChange={(value) => handlePrivacyChange(value as 'public' | 'private' | 'friends')}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="privacy-public" />
                  <Label htmlFor="privacy-public">Public</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="friends" id="privacy-friends" />
                  <Label htmlFor="privacy-friends">Friends Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="privacy-private" />
                  <Label htmlFor="privacy-private">Private</Label>
                </div>
              </RadioGroup>
              <p className="text-sm text-gray-500 mt-2">
                {settings.privacy === 'public' && 'Anyone can view your profile and notes marked as public.'}
                {settings.privacy === 'friends' && 'Only your connections can view your profile and notes.'}
                {settings.privacy === 'private' && 'Your profile and notes are visible only to you.'}
              </p>
            </div>
          </TabsContent>
          
          {/* Account Settings */}
          <TabsContent value="account" className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium">Account Information</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span>{currentUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Username:</span>
                  <span>{currentUser.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span>{currentUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Major:</span>
                  <span>{currentUser.major}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Created:</span>
                  <span>{new Date(currentUser.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium text-red-500 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-500 mb-4">
                These actions are irreversible. Please proceed with caution.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="w-full"
              >
                <i className="fa-solid fa-sign-out-alt mr-2"></i>
                Log Out
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSettings}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;