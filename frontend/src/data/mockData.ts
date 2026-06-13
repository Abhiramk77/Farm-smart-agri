export const ROLES = [
{
  id: 'agriculture',
  name: 'Agriculture Farmer',
  image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&q=80&w=800'
},
{
  id: 'aquaculture',
  name: 'Aquaculture Farmer',
  image: 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?auto=format&fit=crop&q=80&w=800'
},
{
  id: 'dairy',
  name: 'Dairy Farmer',
  image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=800'
},
{
  id: 'poultry',
  name: 'Poultry Farmer',
  image:
  'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=800'
},
{
  id: 'buyer',
  name: 'Buyer',
  image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800'
}];


export const CATEGORIES = {
  agriculture: [
  {
    id: 'rice',
    name: 'Rice',
    image:
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'wheat',
    name: 'Wheat',
    image:
    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'tomato',
    name: 'Tomato',
    image:
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'onion',
    name: 'Onion',
    image:
    'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=400'
  }],

  aquaculture: [
  {
    id: 'fish',
    name: 'Fish',
    image:
    'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'shrimp',
    name: 'Shrimp',
    image:
    'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&q=80&w=400'
  }],

  dairy: [
  {
    id: 'milk',
    name: 'Milk',
    image:
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'butter',
    name: 'Butter',
    image:
    'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'cheese',
    name: 'Cheese',
    image:
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&q=80&w=400'
  }],

  poultry: [
  {
    id: 'eggs',
    name: 'Eggs',
    image:
    'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'chicken',
    name: 'Chicken',
    image:
    'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=400'
  }]

};

export const MOCK_CONTRACTS = [
{
  id: 'c1',
  buyerName: 'Fresh Foods Inc.',
  buyerRating: 4.8,
  category: 'agriculture',
  product: 'Tomato',
  productImage: CATEGORIES.agriculture[2].image,
  quantity: '500 kg',
  quality: 'Grade A',
  price: '$1.20 / kg',
  totalPrice: '$600',
  timeline: 'Oct 15 - Nov 30',
  deliveryLocation: 'Central Market, City Center',
  distance: '12 km',
  transportIncluded: true,
  status: 'pending',
  createdAt: '2023-10-01T10:00:00Z'
},
{
  id: 'c2',
  buyerName: 'Local Grocers',
  buyerRating: 4.5,
  category: 'dairy',
  product: 'Milk',
  productImage: CATEGORIES.dairy[0].image,
  quantity: '1000 L',
  quality: 'Standard',
  price: '$0.80 / L',
  totalPrice: '$800',
  timeline: 'Oct 20 - Oct 25',
  deliveryLocation: 'Northside Distribution',
  distance: '25 km',
  transportIncluded: false,
  status: 'active',
  progress: 'growing', // planting, growing, harvesting, ready, delivered
  createdAt: '2023-10-05T14:30:00Z'
},
{
  id: 'c3',
  buyerName: 'AgriCorp',
  buyerRating: 4.9,
  category: 'agriculture',
  product: 'Wheat',
  productImage: CATEGORIES.agriculture[1].image,
  quantity: '5 Tons',
  quality: 'Premium',
  price: '$300 / Ton',
  totalPrice: '$1500',
  timeline: 'Nov 01 - Dec 15',
  deliveryLocation: 'Port Silo 4',
  distance: '45 km',
  transportIncluded: true,
  status: 'pending',
  createdAt: '2023-10-10T09:15:00Z'
}];


export const MOCK_CHATS = [
{
  id: 'chat1',
  name: 'Fresh Foods Inc.',
  avatar:
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
  lastMessage: 'Can you deliver by next Tuesday?',
  time: '10:30 AM',
  unread: 2
},
{
  id: 'chat2',
  name: 'Local Grocers',
  avatar:
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
  lastMessage: 'The quality looks great, thanks!',
  time: 'Yesterday',
  unread: 0
}];

export const MOCK_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'order',
    title: 'New Contract Request',
    description: 'Fresh Foods Inc. has sent you a contract request for 500kg of Tomatoes.',
    timestamp: '2 mins ago',
    read: false,
    targetRole: 'farmer',
  },
  {
    id: 'n2',
    type: 'order',
    title: 'Contract Activated',
    description: 'Your contract with Local Grocers for 1000L of Milk is now active.',
    timestamp: '1 hour ago',
    read: false,
    targetRole: 'farmer',
  },
  {
    id: 'n3',
    type: 'order',
    title: 'Order Dispatched',
    description: 'Your order of 1000L of Milk is currently in transit to Northside Distribution.',
    timestamp: '3 hours ago',
    read: false,
    targetRole: 'buyer',
  },
  {
    id: 'n4',
    type: 'system',
    title: 'Payment Received',
    description: 'Payment of $800 from Local Grocers has been successfully processed.',
    timestamp: '1 day ago',
    read: true,
    targetRole: 'farmer',
  },
  {
    id: 'n5',
    type: 'order',
    title: 'New Contract Available',
    description: 'A new farmer in your area has listed 5 Tons of Wheat.',
    timestamp: '2 days ago',
    read: true,
    targetRole: 'buyer',
  }
];