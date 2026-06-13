import React, { useState } from 'react';
import { Mic, X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const toggleListen = () => {
    if (isListening) {
      setIsListening(false);
      // Mock processing
      setTimeout(() => {
        setResponse(
          'I found 3 new rice contracts nearby. Would you like me to read them?'
        );
      }, 1000);
    } else {
      setIsListening(true);
      setTranscript('');
      setResponse('');
      // Mock listening
      let dots = 0;
      const interval = setInterval(() => {
        dots = (dots + 1) % 4;
        setTranscript('Listening' + '.'.repeat(dots));
      }, 500);
      setTimeout(() => {
        clearInterval(interval);
        setTranscript('Show rice contracts');
        setIsListening(false);
        setTimeout(() => {
          setResponse(
            'I found 3 new rice contracts nearby. Would you like me to read them?'
          );
        }, 800);
      }, 3000);
    }
  };
  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-6 p-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary-light transition-colors z-40">
        
        <Mic size={24} />
      </button>

      {/* Voice Panel Modal */}
      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{
            opacity: 0,
            y: 50
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: 50
          }}
          className="fixed bottom-24 md:bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-100">
          
            <div className="p-4 bg-primary text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Volume2 size={20} />
                <span className="font-medium">Smart Assistant</span>
              </div>
              <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white">
              
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center min-h-[250px]">
              <div className="flex-1 w-full flex flex-col justify-end gap-4 mb-6">
                {transcript &&
              <div className="self-end bg-gray-100 text-gray-800 py-2 px-4 rounded-2xl rounded-tr-sm max-w-[85%] text-sm">
                    {transcript}
                  </div>
              }
                {response &&
              <div className="self-start bg-primary/10 text-primary-dark py-2 px-4 rounded-2xl rounded-tl-sm max-w-[85%] text-sm">
                    {response}
                  </div>
              }
                {!transcript && !response &&
              <div className="text-center text-gray-400 text-sm mb-4">
                    Try saying:
                    <br />
                    "Show rice contracts"
                    <br />
                    "Accept this order"
                    <br />
                    "What is the price?"
                  </div>
              }
              </div>

              <button
              onClick={toggleListen}
              className={`p-6 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110' : 'bg-primary text-white hover:bg-primary-light'}`}>
              
                <Mic size={32} />
              </button>
              <p className="text-xs text-gray-500 mt-4">
                {isListening ? 'Tap to stop' : 'Tap to speak'}
              </p>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </>);

}