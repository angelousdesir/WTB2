export interface Post {
  id: string;
  user_id: string;
  venue_id?: string;
  menu_item_id?: string;
  caption: string;
  image_url?: string;
  rating: number;
  category?: string;
  created_at: string;
  updated_at?: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
  venue?: {
    name: string;
  };
  menu_item?: {
    name: string;
  };
}

export interface CreatePostDto {
  caption: string;
  image?: File;
  rating: number;
  venue_id?: string;
  menu_item_id?: string;
  category?: string;
}