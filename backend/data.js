export const INITIAL_USERS = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@farming.com',
    password: 'password123',
    role: 'admin',
  },
  {
    id: 'u2',
    name: 'John Farmer',
    email: 'farmer@farming.com',
    password: 'password123',
    role: 'farmer',
    category: 'agriculture',
    mobile: '1234567890',
    state: 'California',
    city: 'Fresno'
  },
  {
    id: 'u3',
    name: 'Acme Buyer',
    email: 'buyer@farming.com',
    password: 'password123',
    role: 'buyer',
    mobile: '0987654321',
    state: 'New York',
    city: 'NYC'
  }
];

export let resetTokens = [];

export const INITIAL_CHATS = [
  {
    id: 'chat_1',
    name: 'Fresh Foods Co.',
    avatar: 'https://ui-avatars.com/api/?name=Fresh+Foods&background=0D8ABC&color=fff',
    lastMessage: 'Is the price negotiable?',
    time: '10:30 AM',
    unread: 2,
  },
  {
    id: 'chat_2',
    name: 'Green Valley Dairy',
    avatar: 'https://ui-avatars.com/api/?name=Green+Valley&background=2D6A4F&color=fff',
    lastMessage: 'We will dispatch the truck tomorrow morning.',
    time: 'Yesterday',
    unread: 0,
  }
];

export const INITIAL_CONTRACTS = [
  {
    id: 'c1',
    buyerName: 'Fresh Foods Co.',
    buyerRating: 4.8,
    category: 'agriculture',
    product: 'Organic Tomatoes',
    productImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
    quantity: '500 kg',
    quality: 'Grade A',
    price: '$2.50/kg',
    totalPrice: '$1,250',
    timeline: 'Oct 15 - Nov 30',
    deliveryLocation: 'Central Market, NY',
    distance: '45 miles',
    transportIncluded: false,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c2',
    buyerName: 'Green Valley Dairy',
    buyerRating: 4.9,
    category: 'dairy',
    product: 'Raw Milk',
    productImage: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800',
    quantity: '1000 L/week',
    quality: 'Premium',
    price: '$1.20/L',
    totalPrice: '$4,800/mo',
    timeline: 'Ongoing',
    deliveryLocation: 'Processing Plant, NJ',
    distance: '12 miles',
    transportIncluded: true,
    status: 'active',
    progress: 'growing',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c3',
    buyerName: 'Ocean Catch Inc.',
    buyerRating: 4.6,
    category: 'aquaculture',
    product: 'Atlantic Salmon',
    productImage: 'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?auto=format&fit=crop&q=80&w=800',
    quantity: '2000 lbs',
    quality: 'Export Grade',
    price: '$8.50/lb',
    totalPrice: '$17,000',
    timeline: 'Dec 1 - Dec 15',
    deliveryLocation: 'Port Authority, Boston',
    distance: '85 miles',
    transportIncluded: false,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
];
