export interface Post {
  id: string;
  user_id: string;
  venue_id: string;
  menu_item_id?: string;
  title: string;
  content: string;
  rating: number;
  image_url?: string;
  created_at: string;
  updated_at?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  venue?: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
  menu_item?: {
    id: string;
    name: string;
    category?: string;
    price?: number;
  };
}

export interface CreatePostDto {
  venue_id: string;
  menu_item_id?: string;
  title: string;
  content: string;
  rating: number;
  image?: File;
}