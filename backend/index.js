import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import { User, Contract, Chat } from './models.js';
import { INITIAL_CHATS, INITIAL_CONTRACTS, INITIAL_USERS } from './data.js';

// Ensure DNS SRV resolution works across Windows networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore fallback if custom DNS setting is unsupported
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-agri')
  .then(async () => {
    console.log('Connected to MongoDB');
    // Seed initial data if DB is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding initial data...');
      await User.insertMany(INITIAL_USERS);
      await Contract.insertMany(INITIAL_CONTRACTS);
      await Chat.insertMany(INITIAL_CHATS);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// --- AUTHENTICATION ENDPOINTS ---

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, mobile, state, city, role, category } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    let user = await User.findOne({ email });
    if (user) {
      user.name = name || user.name;
      user.mobile = mobile || user.mobile;
      user.state = state || user.state;
      user.city = city || user.city;
      user.category = category || user.category;
      await user.save();
      return res.status(200).json({ user, token: `mock_token_${user.id}` });
    }
    const newUser = new User({
      id: `u_${Date.now()}`,
      name, email, mobile, state, city, role, category
    });
    await newUser.save();
    res.status(201).json({ user: newUser, token: `mock_token_${newUser.id}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, role, category } = req.body;
    if (email) {
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });
      return res.json({ user, token: `mock_token_${user.id}` });
    }
    if (role) {
       const mockUser = { id: `u_${Date.now()}`, name: 'Mock User', role, category };
       return res.json({ user: mockUser, token: `mock_token_${mockUser.id}` });
    }
    return res.status(400).json({ message: 'Invalid request' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    if (!token.startsWith('mock_token_')) return res.status(401).json({ message: 'Invalid token' });
    const userId = token.replace('mock_token_', '');
    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- CONTRACT ENDPOINTS ---

// GET /api/contracts
app.get('/api/contracts', async (req, res) => {
  try {
    const { status } = req.query;
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1] || '';
    const userId = token.startsWith('mock_token_') ? token.replace('mock_token_', '') : null;

    if (userId) {
      const user = await User.findOne({ id: userId });
      if (user && user.role === 'buyer') {
        if (user.email === 'buyer@farming.com' || userId === 'u3') {
          const allContracts = await Contract.find();
          return res.json(allContracts);
        }
        const buyerContracts = await Contract.find({ $or: [{ buyerId: userId }, { buyerName: user.name }] });
        return res.json(buyerContracts);
      }
      
      let query = { $or: [{ farmerId: userId }, { status: 'pending' }] };
      if (status === 'active' || status === 'completed') {
        query = { status: status, farmerId: userId };
      }
      const farmerContracts = await Contract.find(query);
      return res.json(farmerContracts);
    }

    const query = status ? { status } : {};
    const contracts = await Contract.find(query);
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/contracts/marketplace
app.get('/api/contracts/marketplace', async (req, res) => {
  try {
    const contracts = await Contract.find({ status: 'pending' });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/contracts/:id
app.get('/api/contracts/:id', async (req, res) => {
  try {
    const contract = await Contract.findOne({ id: req.params.id });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/contracts
app.post('/api/contracts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1] || '';
    const userId = token.startsWith('mock_token_') ? token.replace('mock_token_', '') : null;
    let user = null;
    if (userId) user = await User.findOne({ id: userId });

    const newContract = new Contract({
      ...req.body,
      id: `c_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      productImage: req.body.productImage || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
      buyerRating: 5.0,
      buyerId: userId || req.body.buyerId,
      buyerName: user ? user.name : (req.body.buyerName || 'Buyer'),
    });
    await newContract.save();
    res.status(201).json(newContract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/contracts/:id/accept
app.post('/api/contracts/:id/accept', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1] || '';
    const userId = token.startsWith('mock_token_') ? token.replace('mock_token_', '') : null;

    const contract = await Contract.findOne({ id: req.params.id });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    contract.status = 'active';
    contract.progress = 'planting';
    if (userId) contract.farmerId = userId;
    
    await contract.save();
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/contracts/:id/reject
app.post('/api/contracts/:id/reject', async (req, res) => {
  try {
    const contract = await Contract.findOne({ id: req.params.id });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    
    contract.status = 'rejected';
    await contract.save();
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/contracts/:id/progress
app.put('/api/contracts/:id/progress', async (req, res) => {
  try {
    const contract = await Contract.findOne({ id: req.params.id });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    
    const { progress } = req.body;
    contract.progress = progress;
    if (progress === 'delivered') {
      contract.status = 'completed';
    }
    
    await contract.save();
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/contracts/:id
app.delete('/api/contracts/:id', async (req, res) => {
  try {
    const deleted = await Contract.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ message: 'Contract not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/chats
app.get('/api/chats', async (req, res) => {
  try {
    const chats = await Chat.find();
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;
