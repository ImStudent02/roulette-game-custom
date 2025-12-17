'use client';

import Link from 'next/link';

export default function StoryPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.08) 0%, transparent 50%)',
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 80% 80%, rgba(139,69,19,0.1) 0%, transparent 40%)',
          }}
        />
      </div>
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#080808]/80 border-b border-[rgba(251,191,36,0.1)]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            href="/"
            className="text-[#fbbf24] hover:text-[#f59e0b] transition-colors flex items-center gap-2"
          >
            <span className="text-xl">←</span>
            <span className="text-sm uppercase tracking-wider">Return to Game</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/story-animated"
              className="px-4 py-2 bg-gradient-to-r from-[#fbbf24] to-[#b45309] text-black font-bold text-sm rounded-full hover:shadow-lg hover:shadow-[#fbbf24]/30 transition-all flex items-center gap-2"
            >
              <span>▶</span>
              <span>Watch</span>
            </Link>
            <div className="text-2xl">🥭</div>
          </div>
        </div>
      </nav>
      
      {/* Story Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 pt-28 pb-20">
        {/* Title Section */}
        <header className="text-center mb-16">
          <div className="text-6xl mb-6">🥭</div>
          <h1 
            className="text-4xl md:text-5xl font-serif font-bold mb-4"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #b45309 50%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 60px rgba(251,191,36,0.3)',
            }}
          >
            The House of the Mango Devil
          </h1>
          <p className="text-gray-500 text-sm uppercase tracking-[0.3em]">
            The Story Behind the Wheel
          </p>
        </header>
        
        {/* Story Sections */}
        <article className="space-y-12 text-gray-300 leading-relaxed font-serif text-lg">
          {/* Opening */}
          <section className="story-section">
            <p className="text-xl text-gray-400 italic mb-8 text-center">
              Long ago, when hope felt heavier than hunger, a poor gambler stood before a large house at the edge of the land.
            </p>
            
            <div className="space-y-6">
              <p>The house was not feared.<br/>It was <span className="text-[#fbbf24]">respected</span>.</p>
              
              <p>Warm lights glowed behind tall windows.<br/>
              The walls were clean. Strong. Expensive.<br/>
              Nothing about the place looked cruel.</p>
              
              <p className="text-center text-2xl my-8 text-gray-500">He knocked.</p>
            </div>
          </section>
          
          {/* The Man */}
          <section className="story-section border-t border-[rgba(251,191,36,0.1)] pt-12">
            <p>The door opened to a man who looked nothing like a devil.</p>
            
            <div className="my-8 pl-6 border-l-2 border-[#fbbf24]/30 space-y-2 text-gray-400 italic">
              <p>Well dressed. Calm. Polite.</p>
              <p>The kind of man whose life never rushed him.</p>
              <p>The kind of man who had never needed luck.</p>
            </div>
            
            <p>The man studied the gambler for a moment and asked quietly,</p>
            
            <p className="text-center text-xl my-6 text-[#fbbf24]">"What are you looking for?"</p>
            
            <p>The gambler lowered his eyes and spoke of suffering.<br/>
            A family in pain. Hunger. Illness. Helplessness.</p>
            
            <p className="mt-6 text-gray-500 italic">Every word sounded real.<br/>
            Every word was a lie.</p>
          </section>
          
          {/* The Truth */}
          <section className="story-section border-t border-[rgba(251,191,36,0.1)] pt-12">
            <p>The man listened without reaction.<br/>
            Then he said,</p>
            
            <p className="text-center text-xl my-6 text-[#fbbf24]">"Tell me again."<br/>
            <span className="text-gray-400">"This time… look into my eyes."</span></p>
            
            <p className="text-gray-400 italic my-8 text-center">
              The gambler did not know the rule of that house:<br/>
              anyone who spoke while looking into those eyes had their thoughts laid bare.
            </p>
            
            <p>As the story was repeated, the truth surfaced —<br/>
            not desperation, but <span className="text-red-400">impatience</span>;<br/>
            not responsibility, but <span className="text-red-400">hunger for easy reward</span>.</p>
            
            <p className="mt-6">Still, the man showed no anger.</p>
            
            <p className="mt-6">He only said,</p>
            
            <div 
              className="my-10 py-8 px-6 text-center rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(139,69,19,0.1) 100%)',
                border: '1px solid rgba(251,191,36,0.2)',
              }}
            >
              <p className="text-2xl text-[#fbbf24] font-serif">
                "Nothing in this universe is free."
              </p>
            </div>
          </section>
          
          {/* The Choice */}
          <section className="story-section border-t border-[rgba(251,191,36,0.1)] pt-12">
            <p>After a pause, he added,</p>
            
            <p className="text-[#fbbf24] my-4">"I can offer you work."<br/>
            "You may earn slowly and honestly in my mango farm."</p>
            
            <p className="text-gray-500 italic my-6">The gambler shifted uncomfortably.<br/>
            Slow earnings had never saved him.</p>
            
            <p>The man continued, his voice unchanged,</p>
            
            <p className="text-[#fbbf24] my-4">"Or… we can play a simple game."</p>
            
            <p>He gestured toward the hall inside.</p>
            
            <div className="my-8 pl-6 border-l-2 border-[#fbbf24]/30 space-y-2">
              <p>"Pick a number between one and fifty."</p>
              <p>"We spin the wheel."</p>
              <p>"If your luck is real, I will fulfill your desire immediately."</p>
            </div>
            
            <p>Then came the warning — calm, precise, unavoidable.</p>
            
            <div 
              className="my-8 py-6 px-6 rounded-lg bg-red-950/20 border border-red-900/30"
            >
              <p className="text-red-400">"If you lose…"<br/>
              "you walk away — and the words you spoke about your family may stop being a story."</p>
            </div>
          </section>
          
          {/* The Decision */}
          <section className="story-section border-t border-[rgba(251,191,36,0.1)] pt-12">
            <p className="text-gray-400 italic">The gambler smiled to himself.</p>
            
            <p className="my-6 text-gray-500 italic">What nonsense, he thought.<br/>
            Many had spoken such threats before.<br/>
            None of them had ever come true.</p>
            
            <p>Luck had always felt closer than labor.<br/>
            <span className="text-gray-400">Faster. Kinder. More familiar.</span></p>
            
            <p className="my-8 text-xl text-center">He chose the wheel as he wanted free mangos.</p>
            
            <p className="text-[#fbbf24]">The man stepped aside and welcomed him in.</p>
          </section>
          
          {/* The Wheel */}
          <section className="story-section border-t border-[rgba(251,191,36,0.1)] pt-12">
            <p className="text-gray-400 italic">Inside the house, silence ruled.<br/>
            No celebration. No noise.<br/>
            Only a large wheel standing patiently at the center.</p>
            
            <div className="my-12 text-center">
              <div 
                className="inline-block text-6xl animate-pulse"
                style={{
                  filter: 'drop-shadow(0 0 30px rgba(251,191,36,0.5))',
                }}
              >
                🎡
              </div>
            </div>
            
            <p>They played by the rules.<br/>
            Nothing was hidden.<br/>
            Nothing was changed.</p>
            
            <p className="my-8 text-center text-2xl text-[#fbbf24]">The wheel spun.</p>
            
            <p className="text-center text-xl text-red-400">The chosen number did not appear.</p>
            
            <p className="text-center text-3xl my-8 font-bold text-red-500">The gambler lost.</p>
          </section>
          
          {/* The Revelation */}
          <section className="story-section border-t border-[rgba(251,191,36,0.1)] pt-12">
            <p>That was when the man finally looked different.</p>
            
            <p className="my-6 text-gray-400 italic">Not loud.<br/>
            Not monstrous.</p>
            
            <p className="text-xl text-[#fbbf24]">Just… honest.</p>
            
            <p className="my-8 text-center text-gray-500">The gambler understood too late.</p>
            
            <div 
              className="my-10 py-8 px-6 text-center rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(139,69,19,0.2) 0%, rgba(0,0,0,0.3) 100%)',
                border: '1px solid rgba(251,191,36,0.3)',
                boxShadow: '0 0 60px rgba(251,191,36,0.1)',
              }}
            >
              <p className="text-3xl font-serif" style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                The man was the Mango Devil.
              </p>
            </div>
          </section>
          
          {/* The Consequence */}
          <section className="story-section border-t border-[rgba(251,191,36,0.1)] pt-12">
            <p>The Devil spoke softly,</p>
            
            <p className="my-4 text-[#fbbf24]">"Your wish has been fulfilled."<br/>
            "You are free to go."</p>
            
            <p className="text-gray-400 italic">The gambler didn't understand —<br/>
            until life answered for him.</p>
            
            <div className="my-8 space-y-4 text-gray-400">
              <p>The story he invented about his family became <span className="text-red-400">real</span>.</p>
              <p>The suffering he used as leverage became his <span className="text-red-400">future</span>.</p>
              <p>The shortcut he trusted became his <span className="text-red-400">fate</span>.</p>
            </div>
            
            <p className="text-gray-500 italic">The Devil never followed him.<br/>
            Never mocked him.<br/>
            Never chased another soul.</p>
          </section>
          
          {/* The Legacy */}
          <section className="story-section border-t border-[rgba(251,191,36,0.1)] pt-12">
            <p>From that day on, the Mango Devil kept his doors open —<br/>
            <span className="text-[#fbbf24]">for all who believe their luck lies inside.</span></p>
            
            <p className="my-8 text-xl text-center">He offers only two choices:</p>
            
            <div className="grid md:grid-cols-2 gap-6 my-10">
              <div 
                className="p-6 rounded-lg text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(0,0,0,0.2) 100%)',
                  border: '1px solid rgba(34,197,94,0.3)',
                }}
              >
                <p className="text-green-400 font-serif">
                  Step back from here.<br/>
                  Work. Earn. Be honest.<br/>
                  <span className="text-green-300 text-xl">Live happy.</span>
                </p>
              </div>
              
              <div 
                className="p-6 rounded-lg text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(0,0,0,0.2) 100%)',
                  border: '1px solid rgba(251,191,36,0.3)',
                }}
              >
                <p className="text-[#fbbf24] font-serif">
                  Or trust the<br/>
                  <span className="text-2xl">Mango Devil's wheel.</span>
                </p>
              </div>
            </div>
          </section>
          
          {/* The Moral */}
          <section className="story-section pt-12">
            <div 
              className="py-12 px-8 rounded-xl text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(139,69,19,0.15) 0%, rgba(0,0,0,0.3) 100%)',
                border: '2px solid rgba(251,191,36,0.2)',
                boxShadow: '0 0 80px rgba(251,191,36,0.1), inset 0 0 60px rgba(0,0,0,0.5)',
              }}
            >
              <p className="text-gray-400 text-lg mb-6">Because the Devil never forces a decision.</p>
              
              <p className="text-xl text-gray-300 mb-4">He only reminds you that</p>
              
              <p 
                className="text-3xl font-serif font-bold"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                gambling was never the answer
              </p>
              
              <p className="text-gray-500 mt-6 text-lg">
                — and the wheel was never built for the player.
              </p>
            </div>
          </section>
        </article>
        
        {/* Footer */}
        <footer className="mt-20 text-center">
          <div className="mb-8 text-4xl">🥭</div>
          <Link 
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#fbbf24] via-[#d97706] to-[#b45309] text-black font-bold rounded-full hover:shadow-[0_0_40px_rgba(251,191,36,0.4)] transition-all hover:scale-105"
          >
            <span>Enter the House</span>
            <span>→</span>
          </Link>
          <p className="mt-8 text-gray-600 text-sm">
            Play responsibly • This is only a game
          </p>
        </footer>
      </main>
    </div>
  );
}
