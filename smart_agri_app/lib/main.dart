import 'dart:convert';
import 'package:flutter/material.dart';

void main() {
  runApp(const SmartAgriApp());
}

// ─── DATA MODELS ───────────────────────────────────────────────────────────────

enum UserRole { farmer, buyer, admin }
enum FarmerCategory { agriculture, aquaculture, dairy, poultry }
enum ContractStatus { pending, active, completed, rejected }
enum ContractProgress { planting, growing, harvesting, ready, delivered }

class User {
  final String id;
  final String name;
  final UserRole role;
  final FarmerCategory? category;
  final String? mobile;
  final String? email;
  final String? state;
  final String? city;

  User({
    required this.id,
    required this.name,
    required this.role,
    this.category,
    this.mobile,
    this.email,
    this.state,
    this.city,
  });
}

class Contract {
  final String id;
  final String buyerName;
  final double buyerRating;
  final String category;
  final String product;
  final String productImage;
  final String quantity;
  final String quality;
  final String price;
  final String totalPrice;
  final String timeline;
  final String deliveryLocation;
  final String distance;
  final bool transportIncluded;
  ContractStatus status;
  ContractProgress? progress;
  final DateTime createdAt;

  Contract({
    required this.id,
    required this.buyerName,
    required this.buyerRating,
    required this.category,
    required this.product,
    required this.productImage,
    required this.quantity,
    required this.quality,
    required this.price,
    required this.totalPrice,
    required this.timeline,
    required this.deliveryLocation,
    required this.distance,
    required this.transportIncluded,
    required this.status,
    this.progress,
    required this.createdAt,
  });

  Contract copyWith({ContractStatus? status, ContractProgress? progress}) {
    return Contract(
      id: id,
      buyerName: buyerName,
      buyerRating: buyerRating,
      category: category,
      product: product,
      productImage: productImage,
      quantity: quantity,
      quality: quality,
      price: price,
      totalPrice: totalPrice,
      timeline: timeline,
      deliveryLocation: deliveryLocation,
      distance: distance,
      transportIncluded: transportIncluded,
      status: status ?? this.status,
      progress: progress ?? this.progress,
      createdAt: createdAt,
    );
  }
}

class ChatThread {
  final String id;
  final String name;
  final String lastMessage;
  final String time;
  final int unread;

  ChatThread({
    required this.id,
    required this.name,
    required this.lastMessage,
    required this.time,
    required this.unread,
  });
}

// ─── MOCK DATA STORE ────────────────────────────────────────────────────────────

class MockStore extends ChangeNotifier {
  User? _user;
  User? get user => _user;

  List<Contract> _contracts = [
    Contract(
      id: 'c1',
      buyerName: 'Fresh Foods Co.',
      buyerRating: 4.8,
      category: 'agriculture',
      product: 'Organic Tomatoes',
      productImage:
          'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
      quantity: '500 kg',
      quality: 'Grade A',
      price: '₹2.50/kg',
      totalPrice: '₹1,250',
      timeline: 'Oct 15 - Nov 30',
      deliveryLocation: 'Central Market, NY',
      distance: '45 miles',
      transportIncluded: false,
      status: ContractStatus.pending,
      createdAt: DateTime.now(),
    ),
    Contract(
      id: 'c2',
      buyerName: 'Green Valley Dairy',
      buyerRating: 4.9,
      category: 'dairy',
      product: 'Raw Milk',
      productImage:
          'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800',
      quantity: '1000 L/week',
      quality: 'Premium',
      price: '₹1.20/L',
      totalPrice: '₹4,800/mo',
      timeline: 'Ongoing',
      deliveryLocation: 'Processing Plant, NJ',
      distance: '12 miles',
      transportIncluded: true,
      status: ContractStatus.active,
      progress: ContractProgress.growing,
      createdAt: DateTime.now(),
    ),
    Contract(
      id: 'c3',
      buyerName: 'Ocean Catch Inc.',
      buyerRating: 4.6,
      category: 'aquaculture',
      product: 'Atlantic Salmon',
      productImage:
          'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?auto=format&fit=crop&q=80&w=800',
      quantity: '2000 lbs',
      quality: 'Export Grade',
      price: '₹8.50/lb',
      totalPrice: '₹17,000',
      timeline: 'Dec 1 - Dec 15',
      deliveryLocation: 'Port Authority, Boston',
      distance: '85 miles',
      transportIncluded: false,
      status: ContractStatus.pending,
      createdAt: DateTime.now(),
    ),
  ];

  List<Contract> get contracts => _contracts;

  List<ChatThread> get chats => [
        ChatThread(
          id: 'chat1',
          name: 'Fresh Foods Co.',
          lastMessage: 'Is the price negotiable?',
          time: '10:30 AM',
          unread: 2,
        ),
        ChatThread(
          id: 'chat2',
          name: 'Green Valley Dairy',
          lastMessage: 'We will dispatch the truck tomorrow morning.',
          time: 'Yesterday',
          unread: 0,
        ),
      ];

  void login(User u) {
    _user = u;
    notifyListeners();
  }

  void logout() {
    _user = null;
    notifyListeners();
  }

  void acceptContract(String id) {
    _contracts = _contracts.map((c) {
      if (c.id == id) {
        return c.copyWith(
            status: ContractStatus.active,
            progress: ContractProgress.planting);
      }
      return c;
    }).toList();
    notifyListeners();
  }

  void rejectContract(String id) {
    _contracts = _contracts.map((c) {
      if (c.id == id) return c.copyWith(status: ContractStatus.rejected);
      return c;
    }).toList();
    notifyListeners();
  }

  void updateProgress(String id, ContractProgress progress) {
    _contracts = _contracts.map((c) {
      if (c.id == id) {
        final newStatus = progress == ContractProgress.delivered
            ? ContractStatus.completed
            : c.status;
        return c.copyWith(status: newStatus, progress: progress);
      }
      return c;
    }).toList();
    notifyListeners();
  }

  void addContract(Contract contract) {
    _contracts = [..._contracts, contract];
    notifyListeners();
  }
}

// ─── APP ENTRY ─────────────────────────────────────────────────────────────────

final mockStore = MockStore();

class SmartAgriApp extends StatelessWidget {
  const SmartAgriApp({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: mockStore,
      builder: (context, _) {
        return MaterialApp(
          title: 'Smart Agri',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF2D6A4F),
              primary: const Color(0xFF2D6A4F),
            ),
            useMaterial3: true,
            fontFamily: 'Roboto',
          ),
          home: mockStore.user == null
              ? const LandingPage()
              : _homeForRole(mockStore.user!.role),
        );
      },
    );
  }

  Widget _homeForRole(UserRole role) {
    switch (role) {
      case UserRole.farmer:
        return const FarmerShell();
      case UserRole.buyer:
        return const BuyerShell();
      case UserRole.admin:
        return const AdminDashboardPage();
    }
  }
}

// ─── THEME COLORS ───────────────────────────────────────────────────────────────

const kPrimary = Color(0xFF2D6A4F);
const kPrimaryLight = Color(0xFF52B788);
const kBackground = Color(0xFFF0F4F1);

// ─── LANDING PAGE ───────────────────────────────────────────────────────────────

class RoleOption {
  final String id;
  final String name;
  final String imageUrl;
  const RoleOption(this.id, this.name, this.imageUrl);
}

const kRoles = [
  RoleOption('agriculture', 'Agriculture\nFarmer',
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=400'),
  RoleOption('aquaculture', 'Aquaculture\nFarmer',
      'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?auto=format&fit=crop&q=80&w=400'),
  RoleOption('dairy', 'Dairy\nFarmer',
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400'),
  RoleOption('poultry', 'Poultry\nFarmer',
      'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=400'),
  RoleOption('buyer', 'Buyer',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400'),
];


class LandingPage extends StatefulWidget {
  const LandingPage({super.key});
  @override
  State<LandingPage> createState() => _LandingPageState();
}

class _LandingPageState extends State<LandingPage> {
  String? _selected;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBackground,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: kPrimary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Icon(Icons.eco, color: Colors.white, size: 20),
              ),
            ),
            const SizedBox(width: 8),
            const Text('Smart Agri',
                style: TextStyle(
                    color: kPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 18)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const LoginPage())),
            child:
                const Text('Login', style: TextStyle(color: kPrimary)),
          ),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(height: 40),
              const Text('Welcome to Smart Agri',
                  style: TextStyle(
                      fontSize: 40,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1E293B))),
              const SizedBox(height: 16),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  'Connect directly with buyers and farmers. Select your role to get started with\nsmart contract farming.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 16, height: 1.5),
                ),
              ),
              const SizedBox(height: 48),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 16,
                runSpacing: 16,
                children: kRoles.map((role) {
                  final selected = _selected == role.id;
                  return GestureDetector(
                    onTap: () => setState(() => _selected = role.id),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 150,
                      height: 190,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: selected
                            ? Border.all(color: kPrimary, width: 3)
                            : null,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            Image.network(role.imageUrl,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                    color: Colors.grey[300],
                                    child: const Icon(Icons.image))),
                            Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                    Colors.transparent,
                                    Colors.black.withOpacity(0.8),
                                  ],
                                  stops: const [0.5, 1.0],
                                ),
                              ),
                            ),
                            if (selected)
                              Positioned(
                                top: 8,
                                right: 8,
                                child: Container(
                                  decoration: const BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle),
                                  child: const Icon(Icons.check_circle,
                                      color: kPrimary, size: 24),
                                ),
                              ),
                            Positioned(
                              bottom: 16,
                              left: 12,
                              right: 12,
                              child: Text(
                                role.name.replaceAll('\n', ' '),
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 64),
              ElevatedButton(
                onPressed: _selected == null
                    ? null
                    : () => Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) =>
                                  SignupPage(selectedRole: _selected!)),
                        ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: kPrimary,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: const Color(0xFFE2E8F0),
                  disabledForegroundColor: const Color(0xFF94A3B8),
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 48),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Continue',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── SIGNUP PAGE ────────────────────────────────────────────────────────────────

class SignupPage extends StatefulWidget {
  final String selectedRole;
  const SignupPage({super.key, required this.selectedRole});
  @override
  State<SignupPage> createState() => _SignupPageState();
}

class _SignupPageState extends State<SignupPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _mobileCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _stateCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final isBuyer = widget.selectedRole == 'buyer';
      final user = User(
        id: 'u_${DateTime.now().millisecondsSinceEpoch}',
        name: _nameCtrl.text,
        role: isBuyer ? UserRole.buyer : UserRole.farmer,
        category: isBuyer
            ? null
            : FarmerCategory.values.firstWhere(
                (c) => c.name == widget.selectedRole,
                orElse: () => FarmerCategory.agriculture),
        mobile: _mobileCtrl.text,
        email: _emailCtrl.text,
        state: _stateCtrl.text,
        city: _cityCtrl.text,
      );
      mockStore.login(user);
      if (mounted) Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBackground,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        title: const Text('Create Account',
            style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: kPrimary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Icon(Icons.eco, color: Colors.white, size: 32),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              const Center(
                child: Text('Sign Up',
                    style: TextStyle(
                        fontSize: 22, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 24),
              _buildField('Full Name', Icons.person_outline, _nameCtrl),
              const SizedBox(height: 16),
              _buildField('Mobile Number', Icons.phone_outlined, _mobileCtrl,
                  keyboardType: TextInputType.phone,
                  validator: (v) =>
                      (v == null || v.length < 10) ? 'Enter valid mobile' : null),
              const SizedBox(height: 16),
              _buildField('Email Address', Icons.email_outlined, _emailCtrl,
                  keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(
                    child: _buildField('State', Icons.location_on_outlined, _stateCtrl)),
                const SizedBox(width: 12),
                Expanded(
                    child: _buildField('City / Village', Icons.apartment_outlined, _cityCtrl)),
              ]),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kPrimary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Sign Up →',
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(String label, IconData icon, TextEditingController ctrl,
      {TextInputType? keyboardType, String? Function(String?)? validator}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style:
                const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
        const SizedBox(height: 6),
        TextFormField(
          controller: ctrl,
          keyboardType: keyboardType,
          validator: validator ??
              (v) => (v == null || v.isEmpty) ? 'Required' : null,
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: Colors.grey),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: kPrimary),
            ),
            contentPadding:
                const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
          ),
        ),
      ],
    );
  }
}

// ─── LOGIN PAGE ─────────────────────────────────────────────────────────────────

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  UserRole _role = UserRole.farmer;
  final _nameCtrl = TextEditingController();
  final _mobileCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _stateCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();

  void _login() {
    if (_nameCtrl.text.isEmpty && _emailCtrl.text.isEmpty) return;
    final user = User(
      id: 'u_${DateTime.now().millisecondsSinceEpoch}',
      name: _nameCtrl.text.isNotEmpty ? _nameCtrl.text : (_emailCtrl.text.contains('@') ? _emailCtrl.text.split('@')[0] : _emailCtrl.text),
      role: _role,
      category: _role == UserRole.farmer ? FarmerCategory.agriculture : null,
      mobile: _mobileCtrl.text,
      email: _emailCtrl.text,
      state: _stateCtrl.text,
      city: _cityCtrl.text,
    );
    mockStore.login(user);
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBackground,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 40),
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: kPrimary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Icon(Icons.eco, color: Colors.white, size: 32),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Sign In',
                  style: TextStyle(
                      fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 32),
              Container(
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.all(4),
                child: Row(
                  children: UserRole.values.map((r) {
                    final selected = r == _role;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _role = r),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color:
                                selected ? Colors.white : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: selected
                                ? [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.1),
                                      blurRadius: 4,
                                    )
                                  ]
                                : null,
                          ),
                          child: Text(
                            r.name[0].toUpperCase() + r.name.substring(1),
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: selected ? kPrimary : Colors.grey,
                              fontWeight: selected
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 20),
              _field('Full Name', Icons.person_outline, _nameCtrl),
              const SizedBox(height: 12),
              _field('Mobile Number', Icons.phone_outlined, _mobileCtrl,
                  type: TextInputType.phone),
              const SizedBox(height: 12),
              _field('Email Address', Icons.email_outlined, _emailCtrl,
                  type: TextInputType.emailAddress),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                    child: _field('State', Icons.location_on_outlined, _stateCtrl)),
                const SizedBox(width: 12),
                Expanded(
                    child: _field('City', Icons.apartment_outlined, _cityCtrl)),
              ]),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _login,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kPrimary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Sign In →',
                      style: TextStyle(fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(String label, IconData icon, TextEditingController ctrl,
      {TextInputType? type}) {
    return TextFormField(
      controller: ctrl,
      keyboardType: type,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: Colors.grey),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
      ),
    );
  }
}

// ─── FARMER SHELL (bottom nav) ──────────────────────────────────────────────────

class FarmerShell extends StatefulWidget {
  const FarmerShell({super.key});
  @override
  State<FarmerShell> createState() => _FarmerShellState();
}

class _FarmerShellState extends State<FarmerShell> {
  int _index = 0;

  final _pages = const [
    FarmerDashboardPage(),
    MarketplacePage(),
    ChatPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.dashboard_outlined),
              selectedIcon: Icon(Icons.dashboard),
              label: 'Dashboard'),
          NavigationDestination(
              icon: Icon(Icons.store_outlined),
              selectedIcon: Icon(Icons.store),
              label: 'Marketplace'),
          NavigationDestination(
              icon: Icon(Icons.chat_bubble_outline),
              selectedIcon: Icon(Icons.chat_bubble),
              label: 'Chat'),
        ],
      ),
    );
  }
}

// ─── BUYER SHELL ────────────────────────────────────────────────────────────────

class BuyerShell extends StatefulWidget {
  const BuyerShell({super.key});
  @override
  State<BuyerShell> createState() => _BuyerShellState();
}

class _BuyerShellState extends State<BuyerShell> {
  int _index = 0;

  final _pages = const [
    BuyerDashboardPage(),
    ChatPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.dashboard_outlined),
              selectedIcon: Icon(Icons.dashboard),
              label: 'Dashboard'),
          NavigationDestination(
              icon: Icon(Icons.chat_bubble_outline),
              selectedIcon: Icon(Icons.chat_bubble),
              label: 'Chat'),
        ],
      ),
    );
  }
}

// ─── SHARED APP BAR ─────────────────────────────────────────────────────────────

AppBar buildAppBar(String title, BuildContext context) {
  return AppBar(
    backgroundColor: Colors.white,
    elevation: 1,
    title: Text(title,
        style: const TextStyle(
            color: Colors.black87, fontWeight: FontWeight.bold)),
    actions: [
      IconButton(
        icon: const Icon(Icons.logout, color: Colors.black54),
        onPressed: () => mockStore.logout(),
      )
    ],
  );
}

// ─── FARMER DASHBOARD ────────────────────────────────────────────────────────────

class FarmerDashboardPage extends StatelessWidget {
  const FarmerDashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: mockStore,
      builder: (context, _) {
        final user = mockStore.user;
        final contracts = mockStore.contracts
            .where((c) => c.status == ContractStatus.active)
            .toList();

        return Scaffold(
          backgroundColor: kBackground,
          appBar: buildAppBar('Farmer Dashboard', context),
          body: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 800),
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Welcome
                Text('Hello, ${user?.name ?? 'Farmer'}! 👋',
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                const Text('Track your contracts and earnings.',
                    style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 20),

                // Stats row
                Row(children: [
                  _StatCard(
                      label: 'Active',
                      value:
                          contracts.length.toString(),
                      icon: Icons.description_outlined,
                      color: kPrimary),
                  const SizedBox(width: 12),
                  _StatCard(
                      label: 'Pending',
                      value: mockStore.contracts
                          .where((c) => c.status == ContractStatus.pending)
                          .length
                          .toString(),
                      icon: Icons.access_time,
                      color: Colors.orange),
                ]),
                const SizedBox(height: 20),

                // New Requests
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('New Contract Requests',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16)),
                  ],
                ),
                const SizedBox(height: 10),
                ...mockStore.contracts
                    .where((c) => c.status == ContractStatus.pending)
                    .map((c) => _ContractCard(contract: c, isFarmer: true))
                    .toList(),

                const SizedBox(height: 20),
                const Text('Active Contracts',
                    style: TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 10),
                if (contracts.isEmpty)
                  const _EmptyState(
                      message: 'No active contracts yet.',
                      icon: Icons.assignment_outlined),
                ...contracts
                    .map((c) => _ContractCard(contract: c, isFarmer: true))
                    .toList(),
              ],
            ),
          ))),
          floatingActionButton: FloatingActionButton.extended(
            backgroundColor: kPrimary,
            foregroundColor: Colors.white,
            onPressed: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const SellProductPage())),
            icon: const Icon(Icons.add),
            label: const Text('Sell Product'),
          ),
        );
      },
    );
  }
}

// ─── BUYER DASHBOARD ────────────────────────────────────────────────────────────

class BuyerDashboardPage extends StatelessWidget {
  const BuyerDashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: mockStore,
      builder: (context, _) {
        final user = mockStore.user;
        final contracts = mockStore.contracts;

        final stats = [
          {
            'label': 'Active',
            'value': contracts
                .where((c) => c.status == ContractStatus.active)
                .length
                .toString(),
            'icon': Icons.description,
            'color': Colors.blue.shade100,
            'textColor': Colors.blue.shade700,
          },
          {
            'label': 'Pending',
            'value': contracts
                .where((c) => c.status == ContractStatus.pending)
                .length
                .toString(),
            'icon': Icons.access_time,
            'color': Colors.amber.shade100,
            'textColor': Colors.amber.shade700,
          },
          {
            'label': 'Completed',
            'value': contracts
                .where((c) => c.status == ContractStatus.completed)
                .length
                .toString(),
            'icon': Icons.check_circle,
            'color': Colors.green.shade100,
            'textColor': Colors.green.shade700,
          },
        ];

        return Scaffold(
          backgroundColor: kBackground,
          appBar: buildAppBar('Buyer Dashboard', context),
          body: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 800),
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Hello, ${user?.name ?? 'Buyer'}! 👋',
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                const Text('Manage your procurement contracts.',
                    style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 20),

                Row(
                  children: stats.map((s) {
                    return Expanded(
                      child: Container(
                        margin: const EdgeInsets.only(right: 8),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: s['color'] as Color,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(s['icon'] as IconData,
                                color: s['textColor'] as Color, size: 22),
                            const SizedBox(height: 8),
                            Text(s['value'] as String,
                                style: TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                    color: s['textColor'] as Color)),
                            Text(s['label'] as String,
                                style: TextStyle(
                                    fontSize: 11,
                                    color: (s['textColor'] as Color)
                                        .withOpacity(0.8))),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),

                const Text('All Contracts',
                    style: TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 10),
                if (contracts.isEmpty)
                  const _EmptyState(
                      message: 'No contracts yet.',
                      icon: Icons.assignment_outlined),
                ...contracts
                    .map((c) => _ContractCard(contract: c, isFarmer: false))
                    .toList(),
              ],
            ),
          ))),
          floatingActionButton: FloatingActionButton.extended(
            backgroundColor: kPrimary,
            foregroundColor: Colors.white,
            onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) => const CreateContractPage())),
            icon: const Icon(Icons.add),
            label: const Text('New Contract'),
          ),
        );
      },
    );
  }
}

// ─── MARKETPLACE PAGE ────────────────────────────────────────────────────────────

class MarketplacePage extends StatelessWidget {
  const MarketplacePage({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: mockStore,
      builder: (context, _) {
        final pending = mockStore.contracts
            .where((c) => c.status == ContractStatus.pending)
            .toList();

        return Scaffold(
          backgroundColor: kBackground,
          appBar: buildAppBar('Marketplace', context),
          body: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 800),
              child: pending.isEmpty
              ? const _EmptyState(
                  message: 'No contracts available in the marketplace.',
                  icon: Icons.store_outlined)
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: pending.length,
                  itemBuilder: (ctx, i) =>
                      _ContractCard(contract: pending[i], isFarmer: true),
                ))),
        );
      },
    );
  }
}

// ─── CONTRACT CARD ───────────────────────────────────────────────────────────────

class _ContractCard extends StatelessWidget {
  final Contract contract;
  final bool isFarmer;

  const _ContractCard({required this.contract, required this.isFarmer});

  Color _statusColor(ContractStatus s) {
    switch (s) {
      case ContractStatus.active:
        return Colors.green;
      case ContractStatus.pending:
        return Colors.orange;
      case ContractStatus.completed:
        return Colors.blue;
      case ContractStatus.rejected:
        return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
              builder: (_) => ContractDetailPage(contract: contract))),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.07),
                blurRadius: 8,
                offset: const Offset(0, 3))
          ],
        ),
        child: Column(
          children: [
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(16)),
              child: SizedBox(
                height: 200,
                width: double.infinity,
                child: Image.network(contract.productImage,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                        color: Colors.grey[200],
                        child: const Icon(Icons.image, size: 40))),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(contract.product,
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 16)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _statusColor(contract.status).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          contract.status.name[0].toUpperCase() +
                              contract.status.name.substring(1),
                          style: TextStyle(
                              color: _statusColor(contract.status),
                              fontSize: 12,
                              fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text('${contract.buyerName} · ⭐ ${contract.buyerRating}',
                      style: const TextStyle(color: Colors.grey, fontSize: 13)),
                  const SizedBox(height: 10),
                  Row(children: [
                    _InfoChip(icon: Icons.scale, label: contract.quantity),
                    const SizedBox(width: 8),
                    _InfoChip(
                        icon: Icons.currency_rupee,
                        label: contract.totalPrice),
                    const SizedBox(width: 8),
                    _InfoChip(
                        icon: Icons.local_shipping,
                        label: contract.transportIncluded ? 'Incl.' : 'Excl.'),
                  ]),
                  const SizedBox(height: 8),
                  Row(children: [
                    const Icon(Icons.calendar_today,
                        size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(contract.timeline,
                        style: const TextStyle(
                            fontSize: 12, color: Colors.grey)),
                    const SizedBox(width: 12),
                    const Icon(Icons.location_on, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(contract.deliveryLocation,
                          style: const TextStyle(
                              fontSize: 12, color: Colors.grey),
                          overflow: TextOverflow.ellipsis),
                    ),
                  ]),

                  // Action buttons for accepting/rejecting pending contracts
                  if (contract.status == ContractStatus.pending && contract.buyerName != mockStore.user?.name)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Row(children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              mockStore.rejectContract(contract.id);
                            },
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.red,
                              side: const BorderSide(color: Colors.red),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10)),
                            ),
                            child: const Text('Reject'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              mockStore.acceptContract(contract.id);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: kPrimary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10)),
                            ),
                            child: const Text('Accept'),
                          ),
                        ),
                      ]),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: kBackground,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: kPrimary),
          const SizedBox(width: 4),
          Text(label,
              style: const TextStyle(fontSize: 11, color: Colors.black87)),
        ],
      ),
    );
  }
}

// ─── CONTRACT DETAIL PAGE ────────────────────────────────────────────────────────

class ContractDetailPage extends StatelessWidget {
  final Contract contract;
  const ContractDetailPage({super.key, required this.contract});

  static const _stages = [
    ContractProgress.planting,
    ContractProgress.growing,
    ContractProgress.harvesting,
    ContractProgress.ready,
    ContractProgress.delivered,
  ];

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: mockStore,
      builder: (context, _) {
        final liveContract =
            mockStore.contracts.firstWhere((c) => c.id == contract.id,
                orElse: () => contract);

        return Scaffold(
          backgroundColor: kBackground,
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 1,
            title: Text(liveContract.product,
                style: const TextStyle(
                    color: Colors.black87, fontWeight: FontWeight.bold)),
            iconTheme: const IconThemeData(color: Colors.black87),
          ),
          body: SingleChildScrollView(
            child: Column(
              children: [
                SizedBox(
                  height: 200,
                  width: double.infinity,
                  child: Image.network(liveContract.productImage,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                          color: Colors.grey[200],
                          child: const Icon(Icons.image, size: 60))),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Progress stepper (only for active)
                      if (liveContract.status == ContractStatus.active &&
                          liveContract.progress != null) ...[
                        const Text('Production Progress',
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 15)),
                        const SizedBox(height: 12),
                        _ProgressStepper(
                            currentProgress: liveContract.progress!),
                        const SizedBox(height: 16),
                        if (mockStore.user?.role == UserRole.farmer)
                          _nextProgressButton(context, liveContract),
                        const SizedBox(height: 20),
                      ],

                      // Details
                      _DetailCard(contract: liveContract),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _nextProgressButton(BuildContext context, Contract c) {
    final currentIndex = _stages.indexOf(c.progress!);
    if (currentIndex == _stages.length - 1) {
      return const SizedBox.shrink();
    }
    final next = _stages[currentIndex + 1];
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: () {
          mockStore.updateProgress(c.id, next);
          if (next == ContractProgress.delivered) {
            _showReceiptDialog(context, c);
          }
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: kPrimary,
          foregroundColor: Colors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(vertical: 14),
        ),
        child: Text(
            'Mark as ${next.name[0].toUpperCase()}${next.name.substring(1)}'),
      ),
    );
  }

  void _showReceiptDialog(BuildContext context, Contract c) {
    double amount = 0;
    try {
      String cleanAmount = c.totalPrice.replaceAll(RegExp(r'[^0-9.]'), '');
      amount = double.parse(cleanAmount);
    } catch (_) {}

    double stateTax = amount * 0.05;
    double countryTax = amount * 0.02;
    double total = amount + stateTax + countryTax;

    String formatCurrency(double val) => '₹${val.toStringAsFixed(2)}';

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.receipt_long, size: 48, color: kPrimary),
              const SizedBox(height: 16),
              const Text('E-Receipt', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
              Text(DateTime.now().toString().split(' ')[0], style: const TextStyle(color: Colors.grey, fontSize: 14)),
              const Divider(height: 32),
              _receiptRow('Transaction ID', '#PAY-${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}'),
              _receiptRow('Seller / Farmer', mockStore.user?.name ?? 'Unknown'),
              _receiptRow('Contract', c.product),
              _receiptRow('Status', 'Completed', isGreen: true),
              const SizedBox(height: 8),
              const Divider(),
              const SizedBox(height: 8),
              _receiptRow('Subtotal', c.totalPrice),
              _receiptRow('State Tax (5%)', formatCurrency(stateTax)),
              _receiptRow('Country Tax (2%)', formatCurrency(countryTax)),
              const SizedBox(height: 8),
              const Divider(),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total Paid', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(formatCurrency(total), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: kPrimary)),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text('Smart Agri Contract Platform', style: TextStyle(color: Colors.grey, fontSize: 12)),
              const Text('Thank you for your business!', style: TextStyle(color: Colors.grey, fontSize: 12)),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.download),
                label: const Text('Save / Close'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: kPrimary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _receiptRow(String label, String value, {bool isGreen = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 14)),
          Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: isGreen ? Colors.green : Colors.black87)),
        ],
      ),
    );
  }
}

class _ProgressStepper extends StatelessWidget {
  final ContractProgress currentProgress;
  const _ProgressStepper({required this.currentProgress});

  static const _stages = [
    ContractProgress.planting,
    ContractProgress.growing,
    ContractProgress.harvesting,
    ContractProgress.ready,
    ContractProgress.delivered,
  ];

  @override
  Widget build(BuildContext context) {
    final currentIndex = _stages.indexOf(currentProgress);
    return Row(
      children: List.generate(_stages.length * 2 - 1, (i) {
        if (i.isOdd) {
          final stageIndex = i ~/ 2;
          final done = stageIndex < currentIndex;
          return Expanded(
            child: Container(
              height: 3,
              color: done ? kPrimary : Colors.grey.shade300,
            ),
          );
        }
        final stageIndex = i ~/ 2;
        final done = stageIndex <= currentIndex;
        final stage = _stages[stageIndex];
        return Column(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: done ? kPrimary : Colors.grey.shade300,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: done
                    ? const Icon(Icons.check, color: Colors.white, size: 16)
                    : Text('${stageIndex + 1}',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              stage.name[0].toUpperCase() + stage.name.substring(1),
              style: TextStyle(
                  fontSize: 9,
                  color: done ? kPrimary : Colors.grey,
                  fontWeight: done ? FontWeight.bold : FontWeight.normal),
            ),
          ],
        );
      }),
    );
  }
}

class _DetailCard extends StatelessWidget {
  final Contract contract;
  const _DetailCard({required this.contract});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 8,
              offset: const Offset(0, 2))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Contract Details',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const Divider(height: 20),
          _row('Buyer', contract.buyerName),
          _row('Rating', '⭐ ${contract.buyerRating}'),
          _row('Product', contract.product),
          _row('Quantity', contract.quantity),
          _row('Quality', contract.quality),
          _row('Price', contract.price),
          _row('Total Price', contract.totalPrice),
          _row('Timeline', contract.timeline),
          _row('Delivery', contract.deliveryLocation),
          _row('Distance', contract.distance),
          _row('Transport',
              contract.transportIncluded ? 'Included ✓' : 'Not Included'),
        ],
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(label,
                style: const TextStyle(color: Colors.grey, fontSize: 13)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    fontWeight: FontWeight.w500, fontSize: 13)),
          ),
        ],
      ),
    );
  }
}

// ─── CREATE CONTRACT PAGE (Buyer) ────────────────────────────────────────────────

class CreateContractPage extends StatefulWidget {
  const CreateContractPage({super.key});
  @override
  State<CreateContractPage> createState() => _CreateContractPageState();
}

class _CreateContractPageState extends State<CreateContractPage> {
  final _productCtrl = TextEditingController();
  final _quantityCtrl = TextEditingController();
  final _qualityCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _timelineCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  bool _transportIncluded = false;
  String _category = 'agriculture';

  void _submit() {
    if (_productCtrl.text.isEmpty) return;
    final contract = Contract(
      id: 'c_${DateTime.now().millisecondsSinceEpoch}',
      buyerName: mockStore.user?.name ?? 'Buyer',
      buyerRating: 5.0,
      category: _category,
      product: _productCtrl.text,
      productImage: _productCtrl.text.toLowerCase().contains('egg')
          ? 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&q=80&w=800'
          : _category == 'dairy'
              ? 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800'
              : _category == 'aquaculture'
                  ? 'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?auto=format&fit=crop&q=80&w=800'
                  : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
      quantity: _quantityCtrl.text,
      quality: _qualityCtrl.text,
      price: _priceCtrl.text,
      totalPrice: 'TBD',
      timeline: _timelineCtrl.text,
      deliveryLocation: _locationCtrl.text,
      distance: '',
      transportIncluded: _transportIncluded,
      status: ContractStatus.pending,
      createdAt: DateTime.now(),
    );
    mockStore.addContract(contract);
    Navigator.pop(context);
    ScaffoldMessenger.of(context)
        .showSnackBar(const SnackBar(content: Text('Contract created!')));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBackground,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        title: const Text('Create Contract',
            style: TextStyle(
                color: Colors.black87, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Category'),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _category,
              items: ['agriculture', 'aquaculture', 'dairy', 'poultry']
                  .map((c) => DropdownMenuItem(
                      value: c,
                      child: Text(c[0].toUpperCase() + c.substring(1))))
                  .toList(),
              onChanged: (v) => setState(() => _category = v!),
              decoration: _inputDec('Category'),
            ),
            const SizedBox(height: 14),
            TextField(controller: _productCtrl, decoration: _inputDec('Product Name')),
            const SizedBox(height: 14),
            TextField(controller: _quantityCtrl, decoration: _inputDec('Quantity (e.g. 500 kg)')),
            const SizedBox(height: 14),
            TextField(controller: _qualityCtrl, decoration: _inputDec('Quality (e.g. Grade A)')),
            const SizedBox(height: 14),
            TextField(controller: _priceCtrl, decoration: _inputDec('Price (e.g. ₹2.50/kg)')),
            const SizedBox(height: 14),
            TextField(controller: _timelineCtrl, decoration: _inputDec('Timeline (e.g. Oct 15 - Nov 30)')),
            const SizedBox(height: 14),
            TextField(controller: _locationCtrl, decoration: _inputDec('Delivery Location')),
            const SizedBox(height: 14),
            Row(children: [
              Switch(
                value: _transportIncluded,
                onChanged: (v) => setState(() => _transportIncluded = v),
                activeColor: kPrimary,
              ),
              const Text('Transport Included'),
            ]),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: kPrimary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Post Contract',
                    style: TextStyle(fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDec(String label) {
    return InputDecoration(
      labelText: label,
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300)),
    );
  }
}

// ─── SELL PRODUCT PAGE (Farmer) ──────────────────────────────────────────────────

class SellProductPage extends StatefulWidget {
  const SellProductPage({super.key});
  @override
  State<SellProductPage> createState() => _SellProductPageState();
}

class _SellProductPageState extends State<SellProductPage> {
  final _productCtrl = TextEditingController();
  final _quantityCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _category = 'agriculture';

  void _submit() {
    if (_productCtrl.text.isEmpty) return;
    
    final contract = Contract(
      id: 'c_${DateTime.now().millisecondsSinceEpoch}',
      buyerName: mockStore.user?.name ?? 'Farmer',
      buyerRating: 5.0,
      category: _category,
      product: _productCtrl.text,
      productImage: _productCtrl.text.toLowerCase().contains('egg')
          ? 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&q=80&w=800'
          : _category == 'dairy'
              ? 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800'
              : _category == 'aquaculture'
                  ? 'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?auto=format&fit=crop&q=80&w=800'
                  : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
      quantity: _quantityCtrl.text.isEmpty ? '1 unit' : _quantityCtrl.text,
      quality: 'Standard',
      price: _priceCtrl.text.isEmpty ? 'Negotiable' : _priceCtrl.text,
      totalPrice: _priceCtrl.text.isEmpty ? 'Negotiable' : _priceCtrl.text,
      timeline: 'Available Now',
      deliveryLocation: mockStore.user?.city ?? 'Farm',
      distance: 'Local',
      transportIncluded: true,
      status: ContractStatus.pending,
      createdAt: DateTime.now(),
    );
    mockStore.addContract(contract);

    ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Product listed successfully!')));
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBackground,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        title: const Text('Sell a Product',
            style: TextStyle(
                color: Colors.black87, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            DropdownButtonFormField<String>(
              value: _category,
              items: ['agriculture', 'aquaculture', 'dairy', 'poultry']
                  .map((c) => DropdownMenuItem(
                      value: c,
                      child: Text(c[0].toUpperCase() + c.substring(1))))
                  .toList(),
              onChanged: (v) => setState(() => _category = v!),
              decoration: _inputDec('Category'),
            ),
            const SizedBox(height: 14),
            TextField(controller: _productCtrl, decoration: _inputDec('Product Name')),
            const SizedBox(height: 14),
            TextField(controller: _quantityCtrl, decoration: _inputDec('Available Quantity')),
            const SizedBox(height: 14),
            TextField(controller: _priceCtrl, decoration: _inputDec('Asking Price')),
            const SizedBox(height: 14),
            TextField(
              controller: _descCtrl,
              maxLines: 3,
              decoration: _inputDec('Description'),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: kPrimary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('List Product',
                    style: TextStyle(fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDec(String label) {
    return InputDecoration(
      labelText: label,
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300)),
    );
  }
}

// ─── CHAT PAGE ───────────────────────────────────────────────────────────────────

class ChatPage extends StatelessWidget {
  const ChatPage({super.key});

  @override
  Widget build(BuildContext context) {
    final chats = mockStore.chats;
    return Scaffold(
      backgroundColor: kBackground,
      appBar: buildAppBar('Messages', context),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: chats.length,
        itemBuilder: (ctx, i) {
          final chat = chats[i];
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withOpacity(0.06),
                    blurRadius: 6,
                    offset: const Offset(0, 2))
              ],
            ),
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16, vertical: 8),
              leading: CircleAvatar(
                backgroundColor: kPrimaryLight,
                child: Text(
                  chat.name[0].toUpperCase(),
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
              title: Text(chat.name,
                  style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(chat.lastMessage,
                  maxLines: 1, overflow: TextOverflow.ellipsis),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(chat.time,
                      style: const TextStyle(
                          fontSize: 11, color: Colors.grey)),
                  if (chat.unread > 0) ...[
                    const SizedBox(height: 4),
                    Container(
                      width: 20,
                      height: 20,
                      decoration: const BoxDecoration(
                          color: kPrimary, shape: BoxShape.circle),
                      child: Center(
                        child: Text('${chat.unread}',
                            style: const TextStyle(
                                color: Colors.white, fontSize: 11)),
                      ),
                    ),
                  ]
                ],
              ),
              onTap: () => Navigator.push(context,
                  MaterialPageRoute(
                      builder: (_) => ChatThreadPage(thread: chat))),
            ),
          );
        },
      ),
    );
  }
}

class ChatThreadPage extends StatefulWidget {
  final ChatThread thread;
  const ChatThreadPage({super.key, required this.thread});
  @override
  State<ChatThreadPage> createState() => _ChatThreadPageState();
}

class _ChatThreadPageState extends State<ChatThreadPage> {
  final _ctrl = TextEditingController();
  final List<Map<String, String>> _messages = [
    {'sender': 'other', 'text': 'Hello! Interested in your produce.'},
    {'sender': 'me', 'text': 'Sure, what would you like to know?'},
  ];

  void _send() {
    if (_ctrl.text.trim().isEmpty) return;
    setState(() {
      _messages.add({'sender': 'me', 'text': _ctrl.text.trim()});
      _ctrl.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBackground,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        title: Text(widget.thread.name,
            style: const TextStyle(
                color: Colors.black87, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (ctx, i) {
                final msg = _messages[i];
                final isMe = msg['sender'] == 'me';
                return Align(
                  alignment:
                      isMe ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: isMe ? kPrimary : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                            color: Colors.black.withOpacity(0.07),
                            blurRadius: 4)
                      ],
                    ),
                    child: Text(
                      msg['text']!,
                      style: TextStyle(
                          color: isMe ? Colors.white : Colors.black87),
                    ),
                  ),
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      filled: true,
                      fillColor: kBackground,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _send,
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: const BoxDecoration(
                        color: kPrimary, shape: BoxShape.circle),
                    child: const Icon(Icons.send, color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── ADMIN DASHBOARD ────────────────────────────────────────────────────────────

class AdminDashboardPage extends StatelessWidget {
  const AdminDashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: mockStore,
      builder: (context, _) {
        final contracts = mockStore.contracts;
        return Scaffold(
          backgroundColor: kBackground,
          appBar: buildAppBar('Admin Dashboard', context),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Platform Overview',
                    style: TextStyle(
                        fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.4,
                  children: [
                    _AdminStatCard(
                        'Total Contracts',
                        contracts.length.toString(),
                        Icons.description,
                        Colors.blue),
                    _AdminStatCard(
                        'Active',
                        contracts
                            .where((c) => c.status == ContractStatus.active)
                            .length
                            .toString(),
                        Icons.check_circle,
                        Colors.green),
                    _AdminStatCard(
                        'Pending',
                        contracts
                            .where((c) => c.status == ContractStatus.pending)
                            .length
                            .toString(),
                        Icons.access_time,
                        Colors.orange),
                    _AdminStatCard(
                        'Completed',
                        contracts
                            .where(
                                (c) => c.status == ContractStatus.completed)
                            .length
                            .toString(),
                        Icons.done_all,
                        Colors.purple),
                  ],
                ),
                const SizedBox(height: 24),
                const Text('All Contracts',
                    style: TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 10),
                ...contracts
                    .map((c) => _ContractCard(contract: c, isFarmer: false))
                    .toList(),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _AdminStatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _AdminStatCard(this.label, this.value, this.icon, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.07),
              blurRadius: 6,
              offset: const Offset(0, 2))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 28),
          const Spacer(),
          Text(value,
              style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: color)),
          Text(label,
              style: const TextStyle(fontSize: 12, color: Colors.grey)),
        ],
      ),
    );
  }
}

// ─── HELPERS ────────────────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Icon(icon, color: Colors.white, size: 28),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold)),
                Text(label,
                    style: const TextStyle(
                        color: Colors.white70, fontSize: 12)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String message;
  final IconData icon;

  const _EmptyState({required this.message, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: [
            Icon(icon, size: 56, color: Colors.grey.shade300),
            const SizedBox(height: 12),
            Text(message,
                style: const TextStyle(color: Colors.grey, fontSize: 14)),
          ],
        ),
      ),
    );
  }
}
