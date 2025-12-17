'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Story scenes with narration text and image paths
const STORY_SCENES = [
  {
    id: 'intro',
    lines: [
      "Long ago, when hope felt heavier than hunger...",
      "a poor gambler stood before a large house at the edge of the land.",
    ],
    image: '/img/house.png',
  },
  {
    id: 'house',
    lines: [
      "The house was not feared. It was respected.",
      "Warm lights glowed behind tall windows.",
      "The walls were clean. Strong. Expensive.",
      "Nothing about the place looked cruel.",
    ],
    image: '/img/house.png',
  },
  {
    id: 'knock',
    lines: ["He knocked."],
    image: '/img/door.png',
  },
  {
    id: 'man',
    lines: [
      "The door opened to a man who looked nothing like a devil.",
      "Well dressed. Calm. Polite.",
      "The kind of man whose life never rushed him.",
      "The kind of man who had never needed luck.",
    ],
    image: '/img/man.png',
  },
  {
    id: 'question',
    lines: [
      "The man studied the gambler for a moment and asked quietly...",
      '"What are you looking for?"',
    ],
    image: '/img/eyes.png',
  },
  {
    id: 'lie',
    lines: [
      "The gambler lowered his eyes and spoke of suffering.",
      "A family in pain. Hunger. Illness. Helplessness.",
      "Every word sounded real.",
      "Every word was a lie.",
    ],
    image: '/img/gambler.png',
  },
  {
    id: 'truth',
    lines: [
      'The man listened without reaction. Then he said...',
      '"Tell me again."',
      '"This time... look into my eyes."',
    ],
    image: '/img/eyes.png',
  },
  {
    id: 'reveal',
    lines: [
      "The gambler did not know the rule of that house:",
      "anyone who spoke while looking into those eyes had their thoughts laid bare.",
      "As the story was repeated, the truth surfaced...",
      "not desperation, but impatience.",
      "not responsibility, but hunger for easy reward.",
    ],
    image: '/img/eyes.png',
  },
  {
    id: 'nothing-free',
    lines: [
      "Still, the man showed no anger.",
      "He only said...",
      '"Nothing in this universe is free."',
    ],
    image: '/img/man.png',
    highlight: true,
  },
  {
    id: 'choice',
    lines: [
      '"I can offer you work."',
      '"You may earn slowly and honestly in my mango farm."',
      "The gambler shifted uncomfortably.",
      "Slow earnings had never saved him.",
    ],
    image: '/img/mango.png',
  },
  {
    id: 'game',
    lines: [
      'The man continued, his voice unchanged...',
      '"Or... we can play a simple game."',
      '"Pick a number between one and fifty."',
      '"We spin the wheel."',
      '"If your luck is real, I will fulfill your desire immediately."',
    ],
    image: '/img/wheel.png',
  },
  {
    id: 'warning',
    lines: [
      "Then came the warning — calm, precise, unavoidable.",
      '"If you lose..."',
      '"you walk away — and the words you spoke about your family may stop being a story."',
    ],
    image: '/img/devil_reveal.png', // Or maybe man.png with red overlay? Let's use reveal for tension
    danger: true,
  },
  {
    id: 'confidence',
    lines: [
      "The gambler smiled to himself.",
      "What nonsense, he thought.",
      "Many had spoken such threats before.",
      "None of them had ever come true.",
      "Luck had always felt closer than labor.",
      "Faster. Kinder. More familiar.",
    ],
    image: '/img/gambler.png',
  },
  {
    id: 'decision',
    lines: [
      "He chose the wheel as he wanted free mangos.",
      "The man stepped aside and welcomed him in.",
    ],
    image: '/img/door.png',
  },
  {
    id: 'wheel-room',
    lines: [
      "Inside the house, silence ruled.",
      "No celebration. No noise.",
      "Only a large wheel standing patiently at the center.",
    ],
    image: '/img/wheel.png',
  },
  {
    id: 'spin',
    lines: [
      "They played by the rules.",
      "Nothing was hidden. Nothing was changed.",
      "The wheel spun.",
    ],
    image: '/img/wheel.png',
  },
  {
    id: 'loss',
    lines: [
      "The chosen number did not appear.",
      "The gambler lost.",
    ],
    image: '/img/consequence.png',
    danger: true,
  },
  {
    id: 'devil',
    lines: [
      "That was when the man finally looked different.",
      "Not loud. Not monstrous.",
      "Just... honest.",
      "The gambler understood too late.",
      "The man was the Mango Devil.",
    ],
    image: '/img/reveal.png',
    highlight: true,
  },
  {
    id: 'consequence',
    lines: [
      'The Devil spoke softly...',
      '"Your wish has been fulfilled."',
      '"You are free to go."',
      "The gambler didn't understand — until life answered for him.",
      "The story he invented about his family became real.",
      "The suffering he used as leverage became his future.",
      "The shortcut he trusted became his fate.",
    ],
    image: '/img/consequence.png',
  },
  {
    id: 'legacy',
    lines: [
      "The Devil never followed him.",
      "Never mocked him.",
      "Never chased another soul.",
      "From that day on, the Mango Devil kept his doors open —",
      "for all who believe their luck lies inside.",
    ],
    image: '/img/house.png',
  },
  {
    id: 'moral',
    lines: [
      "Because the Devil never forces a decision.",
      "He only reminds you that gambling was never the answer...",
      "and the wheel was never built for the player.",
    ],
    image: '/img/mango.png',
    highlight: true,
  },
];

export default function AnimatedStoryPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  
  // Initialize speech synthesis
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Try to find a good English voice - deep male voice preferred
      const preferredVoice = voices.find(v => 
        v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('James'))
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      
      if (preferredVoice) {
        voiceRef.current = preferredVoice;
        setVoiceReady(true);
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);
  
  const scene = STORY_SCENES[currentScene];
  const isLastScene = currentScene === STORY_SCENES.length - 1;
  const isLastLine = currentLine === scene.lines.length - 1;
  
  // Preload next images
  useEffect(() => {
    const preloadImage = (index: number) => {
      if (index < STORY_SCENES.length) {
        const img = new window.Image();
        img.src = STORY_SCENES[index].image;
      }
    };
    
    preloadImage(currentScene + 1);
    preloadImage(currentScene + 2);
  }, [currentScene]);
  
  // Speak current line
  const speakLine = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voiceRef.current;
    utterance.rate = 0.8; // Slower, more dramatic
    utterance.pitch = 0.8; // Deeper
    utterance.volume = 1;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setDisplayedText(text);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      
      // Auto-advance to next line or scene
      if (!isLastLine) {
        setTimeout(() => {
          setCurrentLine(prev => prev + 1);
        }, 1000); // More pause between lines
      } else if (!isLastScene) {
        setTimeout(() => {
          setCurrentScene(prev => prev + 1);
          setCurrentLine(0);
          setDisplayedText('');
        }, 2000); // More pause between scenes
      }
    };
    
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isLastLine, isLastScene]);
  
  // Play current line when scene/line changes
  useEffect(() => {
    if (isPlaying && hasStarted && scene) {
      const text = scene.lines[currentLine];
      speakLine(text);
    }
  }, [isPlaying, hasStarted, currentScene, currentLine, scene, speakLine]);
  
  const handleStart = () => {
    setHasStarted(true);
    setIsPlaying(true);
  };
  
  const handlePause = () => {
    setIsPlaying(false);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };
  
  const handleResume = () => {
    setIsPlaying(true);
  };
  
  const handleSkip = () => {
    window.speechSynthesis.cancel();
    if (!isLastLine) {
      setCurrentLine(prev => prev + 1);
    } else if (!isLastScene) {
      setCurrentScene(prev => prev + 1);
      setCurrentLine(0);
      setDisplayedText('');
    }
  };
  
  const handleRestart = () => {
    window.speechSynthesis.cancel();
    setCurrentScene(0);
    setCurrentLine(0);
    setDisplayedText('');
    setIsPlaying(true);
  };
  
  // Start screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-black">
        {/* Background Image with blur */}
        <div className="absolute inset-0 opacity-40">
           <Image 
             src="/img/house.png" 
             alt="Background" 
             fill
             className="object-cover blur-sm scale-110"
             priority
           />
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-2xl bg-black/60 p-12 rounded-2xl backdrop-blur-md border border-[#fbbf24]/20">
          <div className="text-6xl mb-6">🥭</div>
          <h1 
            className="text-4xl md:text-6xl font-serif font-bold mb-4"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(251,191,36,0.3)'
            }}
          >
            The House of the Mango Devil
          </h1>
          <p className="text-gray-300 text-lg mb-12 font-serif italic tracking-wide">
            "Nothing in this universe is free."
          </p>
          
          {voiceReady ? (
            <button
              onClick={handleStart}
              className="px-12 py-4 bg-gradient-to-r from-[#fbbf24] to-[#b45309] text-black font-bold text-xl rounded-full hover:shadow-[0_0_50px_rgba(251,191,36,0.5)] transition-all hover:scale-105 active:scale-95"
            >
              ▶ Begin Experience
            </button>
          ) : (
            <p className="text-gray-400 animate-pulse">Initializing narrator...</p>
          )}
          
          <div className="mt-8 flex items-center justify-center gap-2 text-gray-400 text-xs uppercase tracking-widest">
            <span>🎧 Use Headphones</span>
            <span>•</span>
            <span>🔊 Sound On</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Story complete screen
  if (isLastScene && isLastLine && !isSpeaking && displayedText) {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-black">
        <div className="absolute inset-0 opacity-30">
           <Image 
             src="/images/story/mango.png" 
             alt="Background" 
             fill
             className="object-cover"
           />
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-xl bg-black/80 p-12 rounded-2xl backdrop-blur-xl border border-[#fbbf24]/10">
          <h2 
            className="text-4xl font-serif font-bold mb-8 text-[#fbbf24]"
          >
            The End
          </h2>
          
          <div className="flex flex-col gap-4 justify-center">
            <button
              onClick={handleRestart}
              className="px-8 py-3 bg-[#1a1a1a] border border-[#fbbf24]/30 text-[#fbbf24] font-bold rounded-full hover:bg-[#fbbf24]/10 transition-all font-serif"
            >
              ↻ Watch Again
            </button>
            <Link
              href="/"
              className="px-8 py-3 bg-gradient-to-r from-[#fbbf24] to-[#b45309] text-black font-bold rounded-full hover:shadow-[0_0_40px_rgba(251,191,36,0.4)] transition-all font-serif"
            >
              🎡 Enter the House
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Main story view
  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col">
      {/* Cinematic Background with Ken Burns Effect */}
      <div key={scene.image} className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
        <div className="absolute inset-0 animate-ken-burns">
          <Image
            src={scene.image}
            alt="Story scene"
            fill
            className="object-cover opacity-60"
            priority
          />
        </div>
        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
        
        {/* Color Grading Overlay */}
        <div 
          className={`absolute inset-0 mix-blend-overlay transition-colors duration-1000 pointer-events-none ${
            scene?.danger ? 'bg-red-900/40' : scene?.highlight ? 'bg-yellow-900/30' : 'bg-blue-900/10'
          }`} 
        />
      </div>
      
      {/* Scanline/Film Grain Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-20 mix-blend-overlay" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} 
      />
      
      {/* Top controls */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 text-white/50">
        <Link href="/" className="hover:text-[#fbbf24] transition-colors text-sm uppercase tracking-widest">
          ✕ Exit Story
        </Link>
        
        <div className="flex items-center gap-4">
          <span className="text-xs uppercase tracking-widest hidden sm:inline-block">
            Scene {currentScene + 1} / {STORY_SCENES.length}
          </span>
          
          <button onClick={isPlaying ? handlePause : handleResume} className="hover:text-white transition-colors">
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          
          <button onClick={handleSkip} className="hover:text-white transition-colors">
            SKIP ⏭
          </button>
        </div>
      </nav>
      
      {/* Main text area */}
      <main className="relative z-40 flex-1 flex flex-col items-center justify-end pb-24 px-6 text-center">
        <div className="max-w-4xl w-full text-center">
            {/* Animated Text */}
            <p 
              key={`${currentScene}-${currentLine}`}
              className={`text-2xl md:text-4xl lg:text-5xl font-serif font-bold leading-relaxed transition-all duration-700 ${
                isSpeaking ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-4 blur-sm'
              } ${
                scene?.danger ? 'text-red-100 text-shadow-red' : 'text-[#f3f4f6] text-shadow-gold'
              }`}
              style={{
                textShadow: scene?.danger 
                  ? '0 0 30px rgba(220,38,38,0.5)' 
                  : '0 0 30px rgba(0,0,0,0.8)'
              }}
            >
              {displayedText}
            </p>
        </div>
        
        {/* Speaking visualizer */}
        <div className={`mt-12 h-6 flex items-center gap-1 transition-opacity duration-500 ${isSpeaking ? 'opacity-50' : 'opacity-0'}`}>
           {[...Array(5)].map((_, i) => (
             <div 
               key={i} 
               className="w-1 bg-[#fbbf24] rounded-full animate-sound-wave"
               style={{ 
                 height: '100%', 
                 animationDelay: `${i * 0.1}s`,
                 animationDuration: '1s'
               }}
             />
           ))}
        </div>
      </main>
      
      {/* Progress Line */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-white/10 z-50">
        <div 
          className="h-full bg-[#fbbf24] transition-all duration-500 box-shadow-[0_0_20px_#fbbf24]"
          style={{ 
            width: `${((currentScene + (currentLine / scene.lines.length)) / STORY_SCENES.length) * 100}%` 
          }}
        />
      </div>
      
      <style jsx global>{`
        @keyframes ken-burns {
          0% { transform: scale(1.0); }
          100% { transform: scale(1.15); }
        }
        .animate-ken-burns {
          animation: ken-burns 20s ease-out alternate infinite;
        }
        @keyframes sound-wave {
          0%, 100% { height: 20%; }
          50% { height: 100%; }
        }
        .animate-sound-wave {
          animation: sound-wave 1s ease-in-out infinite;
        }
        .text-shadow-gold {
          text-shadow: 0 2px 10px rgba(0,0,0,0.8), 0 0 40px rgba(251,191,36,0.2);
        }
        .text-shadow-red {
          text-shadow: 0 2px 10px rgba(0,0,0,0.8), 0 0 40px rgba(220,38,38,0.4);
        }
      `}</style>
    </div>
  );
}
