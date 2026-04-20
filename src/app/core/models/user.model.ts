export interface User {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  role: 'customer' | 'owner' | 'admin';
  created_at: string;
  updated_at?: string;
}

export interface UserProfile extends User {
  bio?: string;
  location?: string;
  website?: string;
}