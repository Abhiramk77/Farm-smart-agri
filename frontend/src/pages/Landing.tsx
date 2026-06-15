import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROLES } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Leaf } from 'lucide-react';
export function Landing() {
  const navigate = useNavigate();
  const { setPendingRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const handleContinue = () => {
    if (selectedRole) {
      const roleObj = ROLES.find((r) => r.id === selectedRole);
      if (selectedRole === 'buyer') {
        setPendingRole('buyer');
      } else {
        setPendingRole('farmer', selectedRole as any);
      }
      navigate('/signup');
    }
  };
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-6 flex justify-between items-center bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <Leaf size={20} />
          </div>
          <span className="font-bold text-xl text-primary-dark">
            Smart Agri
          </span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="text-primary font-medium hover:text-primary-dark">
          
          Login
        </button>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to Smart Agri
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect directly with buyers and farmers. Select your role to get
            started with smart contract farming.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {ROLES.map((role, index) => {
            const isSelected = selectedRole === role.id;
            return (
              <motion.div
                key={role.id}
                initial={{
                  opacity: 0,
                  y: 20
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: index * 0.1
                }}
                onClick={() => setSelectedRole(role.id)}
                className={`relative cursor-pointer rounded-2xl overflow-hidden bg-white shadow-sm transition-all duration-200 group ${isSelected ? 'ring-4 ring-primary ring-offset-2 scale-[1.02]' : 'hover:shadow-md hover:-translate-y-1'}`}>
                
                <div className="aspect-[4/5] relative">
                  <img
                    src={role.image}
                    alt={role.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {isSelected &&
                  <div className="absolute top-3 right-3 bg-white rounded-full text-primary">
                      <CheckCircle2 size={24} className="fill-current" />
                    </div>
                  }

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold text-lg leading-tight">
                      {role.name}
                    </h3>
                  </div>
                </div>
              </motion.div>);

          })}
        </div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`px-12 py-4 rounded-xl text-lg font-semibold transition-all ${selectedRole ? 'bg-primary text-white hover:bg-primary-dark shadow-lg hover:shadow-xl' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            
            Continue
          </button>
        </div>
      </main>
    </div>);

}