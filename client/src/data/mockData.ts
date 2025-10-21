export interface Category {
  id: string;
  name: string;
}

export interface ListingData {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'ACTIVE' | 'SOLD';
  created_at: string;
  category: {
    name: string;
  };
  user: {
    full_name: string;
  };
  photos: {
    url: string;
    alt: string;
  }[];
}

export const categories: Category[] = [
  { id: '1', name: 'Textbooks' },
  { id: '2', name: 'Electronics' },
  { id: '3', name: 'Furniture' },
  { id: '4', name: 'Clothing' },
  { id: '5', name: 'Sports' },
  { id: '6', name: 'Other' },
];

export const mockListing: ListingData = {
  id: 'listing-1',
  title: 'Calculus Textbook 8th Edition',
  description: 'Calculus: Early Transcendentals by James Stewart. Good condition with minimal highlighting. Perfect for MATH 201.',
  price: 45,
  status: 'ACTIVE',
  created_at: '2025-09-25T10:00:00Z',
  category: {
    name: 'Textbooks'
  },
  user: {
    full_name: 'Bob Smith'
  },
  photos: [
    {
      url: 'https://images.pexels.com/photos/4855373/pexels-photo-4855373.jpeg',
      alt: 'Calculus Textbook'
    }
  ]
};
