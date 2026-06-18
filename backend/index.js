import express from 'express';
import cors from 'cors';
import { INITIAL_CHATS, INITIAL_CONTRACTS, INITIAL_USERS, resetTokens } from './data.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory data store
let contracts = [...INITIAL_CONTRACTS];
let chats = [...INITIAL_CHATS];
let users = [...INITIAL_USERS];

// --- AUTHENTICATION ENDPOINTS ---

// POST /api/auth/signup
app.post('/api/auth/signup', (req, res) => {
  const { name, email, mobile, state, city, role, category } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    // If user already exists, update their details and log them in
    existingUser.name = name || existingUser.name;
    existingUser.mobile = mobile || existingUser.mobile;
    existingUser.state = state || existingUser.state;
    existingUser.city = city || existingUser.city;
    existingUser.category = category || existingUser.category;
    
    return res.status(200).json({ user: existingUser, token: `mock_token_${existingUser.id}` });
  }
  const newUser = {
    id: `u_${Date.now()}`,
    name, email, mobile, state, city, role, category
  };
  users.push(newUser);
  res.status(201).json({ user: newUser, token: `mock_token_${newUser.id}` });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, role, category } = req.body;
  
  if (email) {
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    return res.json({ user, token: `mock_token_${user.id}` });
  }
  
  // Fallback for mock login without email
  if (role) {
     const mockUser = { id: `u_${Date.now()}`, name: 'Mock User', role, category };
     return res.json({ user: mockUser, token: `mock_token_${mockUser.id}` });
  }
  
  return res.status(400).json({ message: 'Invalid request' });
});



// GET /api/auth/me
app.get('/api/auth/me', (req, res) => {
  // Mock me endpoint - expects authorization header Bearer mock_token_id
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  if (!token.startsWith('mock_token_')) return res.status(401).json({ message: 'Invalid token' });
  const userId = token.replace('mock_token_', '');
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// --- CONTRACT ENDPOINTS ---


// GET /api/contracts
// Optional query: ?status=
// Only returns contracts that belong to the requesting farmer (by token)
app.get('/api/contracts', (req, res) => {
  const { status } = req.query;

  // Derive userId from Bearer token (format: mock_token_<id>)
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1] || '';
  const userId = token.startsWith('mock_token_') ? token.replace('mock_token_', '') : null;

  let result = contracts;

  // Filter to this farmer's accepted contracts when authenticated
  if (userId) {
    result = result.filter(c => c.farmerId === userId || (c.status === 'pending'));
    // For active/completed, only show contracts this farmer accepted
    if (status === 'active' || status === 'completed') {
      result = contracts.filter(c => c.status === status && c.farmerId === userId);
      return res.json(result);
    }
  }

  if (status) {
    result = contracts.filter(c => c.status === status);
    return res.json(result);
  }
  res.json(result);
});

// GET /api/contracts/marketplace
app.get('/api/contracts/marketplace', (req, res) => {
  const filtered = contracts.filter(c => c.status === 'pending');
  res.json(filtered);
});

// GET /api/contracts/:id
app.get('/api/contracts/:id', (req, res) => {
  const contract = contracts.find(c => c.id === req.params.id);
  if (!contract) return res.status(404).json({ message: 'Contract not found' });
  res.json(contract);
});

// POST /api/contracts
app.post('/api/contracts', (req, res) => {
  const newContract = {
    ...req.body,
    id: `c_${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    productImage: req.body.productImage || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
    buyerRating: 5.0,
    buyerName: 'Current User',
  };
  contracts.push(newContract);
  res.status(201).json(newContract);
});

// POST /api/contracts/:id/accept
app.post('/api/contracts/:id/accept', (req, res) => {
  const index = contracts.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Contract not found' });

  // Tag the contract with the accepting farmer's userId
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1] || '';
  const userId = token.startsWith('mock_token_') ? token.replace('mock_token_', '') : null;

  contracts[index].status = 'active';
  contracts[index].progress = 'planting';
  if (userId) contracts[index].farmerId = userId;
  
  res.json(contracts[index]);
});

// POST /api/contracts/:id/reject
app.post('/api/contracts/:id/reject', (req, res) => {
  const index = contracts.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Contract not found' });
  
  contracts[index].status = 'rejected';
  res.json(contracts[index]);
});

// PUT /api/contracts/:id/progress
app.put('/api/contracts/:id/progress', (req, res) => {
  const index = contracts.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Contract not found' });
  
  const { progress } = req.body;
  contracts[index].progress = progress;
  if (progress === 'delivered') {
    contracts[index].status = 'completed';
  }
  
  res.json(contracts[index]);
});

// GET /api/chats
app.get('/api/chats', (req, res) => {
  res.json(chats);
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;
