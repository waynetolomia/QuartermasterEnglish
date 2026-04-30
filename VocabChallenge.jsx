import React, { useState, useEffect } from 'react';
import { getFirestore, doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import vocabData from '../../maritime_vocab.json';

// Department mapping to filter vocabulary categories
const deptCategories = {
  DECK: ["Navigation", "Deck Operations", "Deck Machinery", "Maneuvering", "Ship Dynamics", "Stability", "Weather", "Directions", "Communication", "Safety"],
  ENGINE: ["Engine Room", "Ship Structure", "Stability", "Communication"],
  LOGISTICS: ["Cargo Operations", "Operations", "Ship Spaces", "Communication"]
};

const tiers = ['I', 'II', 'III'];

export default function VocabChallenge({ studentId, department = 'DECK', onComplete }) {
  const [dailyWords, setDailyWords] = useState([]);
  const [masteredCount, setMasteredCount] = useState(0);
  
  // Initialize the 3 random words on mount
  useEffect(() => {
    const categories = deptCategories[department.toUpperCase()] || deptCategories.DECK;
    const filtered = vocabData.filter(w => categories.includes(w.category));
    const shuffled = filtered.sort(() => 0.5 - Math.random());
    setDailyWords(shuffled.slice(0, 3));
  }, [department]);

  // Handle Firebase Update when a card is mastered
  const handleMasterCard = async (term) => {
    setMasteredCount(prev => prev + 1);
    
    if (!studentId) return;
    
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', studentId);
      // Automatically increment the user's XP in Firestore and add mastered word
      await updateDoc(userRef, {
        xp: increment(10),
        masteredWords: arrayUnion(term)
      });
    } catch (error) {
      console.error("Error updating XP in Firebase:", error);
    }
  };

  // Trigger completion callback if all 3 are mastered
  useEffect(() => {
    if (masteredCount === 3 && onComplete) {
      setTimeout(onComplete, 1500);
    }
  }, [masteredCount, onComplete]);

  if (dailyWords.length === 0) {
    return <div className="min-h-screen bg-[#0a192f] flex items-center justify-center text-teal-400">Loading Quartermaster's Challenge...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center p-8 font-sans">
      <header className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-teal-200 tracking-widest drop-shadow-lg mb-2">
          VOCABULARY CHALLENGE
        </h1>
        <p className="text-gray-400 tracking-[0.3em] uppercase">{department} DEPARTMENT</p>
      </header>

      <main className="flex flex-col md:flex-row gap-8 items-center justify-center w-full max-w-6xl">
        {dailyWords.map((word, index) => (
          <VocabCard 
            key={index} 
            word={word} 
            tier={tiers[index]} 
            dept={department} 
            onMaster={() => handleMasterCard(word.term)} 
          />
        ))}
      </main>
    </div>
  );
}

const VocabCard = ({ word, tier, dept, onMaster }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isMastered, setIsMastered] = useState(false);
  const [showAnim, setShowAnim] = useState(false);

  // Dynamic Glowing Borders based on Department
  const themeConfig = {
    DECK: { border: 'border-blue-500', shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.6)]', text: 'text-blue-400', buttonHover: 'hover:bg-blue-500/20' },
    ENGINE: { border: 'border-orange-500', shadow: 'shadow-[0_0_20px_rgba(249,115,22,0.6)]', text: 'text-orange-400', buttonHover: 'hover:bg-orange-500/20' },
    LOGISTICS: { border: 'border-teal-500', shadow: 'shadow-[0_0_20px_rgba(20,184,166,0.6)]', text: 'text-teal-400', buttonHover: 'hover:bg-teal-500/20' }
  };

  const theme = themeConfig[dept.toUpperCase()] || themeConfig.DECK;

  const handleReveal = () => setIsRevealed(true);

  const handleMasterClick = (e) => {
    e.stopPropagation(); // Prevent re-triggering the card click
    if (!isMastered) {
      setIsMastered(true);
      setShowAnim(true);
      onMaster();
      // Hide the animation overlay after 2 seconds
      setTimeout(() => setShowAnim(false), 2000);
    }
  };

  return (
    <div 
      onClick={handleReveal}
      className={`relative flex flex-col items-center p-6 w-80 h-[28rem] rounded-2xl border-2 bg-[#112240] transition-all duration-500 cursor-pointer 
      ${theme.border} ${!isMastered && theme.shadow} ${isMastered ? 'opacity-50 scale-95 grayscale-[30%]' : 'hover:-translate-y-2'}`}
    >
      {/* Tier (I, II, III) */}
      <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${theme.border} ${theme.text} font-bold mb-6 shadow-inner`}>
        {tier}
      </div>

      {/* Main Term */}
      <h2 className="text-3xl font-black text-white tracking-wider text-center uppercase mb-auto drop-shadow-md">
        {word.term}
      </h2>

      {/* Definition Area (Hidden until clicked) */}
      <div className="w-full flex-1 flex flex-col items-center justify-center text-center my-4 min-h-[120px] relative">
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${isRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <p className="text-gray-500 italic text-sm animate-pulse">Click to reveal definition...</p>
        </div>
        
        <div className={`flex flex-col items-center justify-center transition-all duration-500 transform ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <p className="text-gray-200 font-medium text-sm mb-4 leading-relaxed">{word.definition}</p>
          {!isMastered && (
            <button 
              onClick={handleMasterClick}
              className={`px-6 py-2 rounded-full border ${theme.border} ${theme.text} font-bold text-xs tracking-widest uppercase transition-colors ${theme.buttonHover}`}
            >
              Master Card
            </button>
          )}
        </div>
      </div>

      {/* XP Value at Bottom */}
      <div className="mt-auto text-amber-400 font-mono font-bold tracking-widest flex items-center gap-2 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
        <span className="text-xl">🪙</span> 10 XP
      </div>

      {/* Floating XP Earned Animation */}
      {showAnim && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a192f]/90 rounded-2xl transition-opacity duration-300">
          <div className="text-center animate-bounce">
            <div className="text-5xl mb-3">⭐</div>
            <div className="text-green-400 font-black text-xl tracking-widest drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]">
              +10 XP EARNED
            </div>
          </div>
        </div>
      )}
    </div>
  );
}