import React, { useState } from 'react';
import { AppMode } from './types';
import TranslationPanel from './components/TranslationPanel';
import ImageAnalysisPanel from './components/ImageAnalysisPanel';
import ImageGenerationPanel from './components/ImageGenerationPanel';
import { Languages, Image, PenTool, Feather } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.TRANSLATE);

  const renderContent = () => {
    switch (mode) {
      case AppMode.TRANSLATE:
        return <TranslationPanel />;
      case AppMode.ANALYZE:
        return <ImageAnalysisPanel />;
      case AppMode.IMAGINE:
        return <ImageGenerationPanel />;
      default:
        return <TranslationPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 font-sans selection:bg-amber-900/30 selection:text-amber-100">
      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-900 rounded-lg flex items-center justify-center text-amber-100">
              <Feather size={18} />
            </div>
            <h1 className="text-xl font-serif font-bold tracking-wide text-stone-100">
              Philo<span className="text-amber-700">Trans</span>
            </h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 bg-stone-800/50 p-1 rounded-lg">
            <button
              onClick={() => setMode(AppMode.TRANSLATE)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                mode === AppMode.TRANSLATE 
                  ? 'bg-stone-700 text-amber-50 shadow-sm' 
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Languages size={16} />
              Translate
            </button>
            <button
              onClick={() => setMode(AppMode.ANALYZE)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                mode === AppMode.ANALYZE 
                  ? 'bg-stone-700 text-amber-50 shadow-sm' 
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Image size={16} />
              Analyze
            </button>
            <button
              onClick={() => setMode(AppMode.IMAGINE)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                mode === AppMode.IMAGINE
                  ? 'bg-stone-700 text-amber-50 shadow-sm' 
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <PenTool size={16} />
              Imagine
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Nav */}
      <div className="md:hidden border-b border-stone-800 bg-stone-900 p-2 flex justify-around">
          <button onClick={() => setMode(AppMode.TRANSLATE)} className={`p-2 rounded-lg ${mode === AppMode.TRANSLATE ? 'text-amber-500 bg-stone-800' : 'text-stone-500'}`}><Languages size={20} /></button>
          <button onClick={() => setMode(AppMode.ANALYZE)} className={`p-2 rounded-lg ${mode === AppMode.ANALYZE ? 'text-amber-500 bg-stone-800' : 'text-stone-500'}`}><Image size={20} /></button>
          <button onClick={() => setMode(AppMode.IMAGINE)} className={`p-2 rounded-lg ${mode === AppMode.IMAGINE ? 'text-amber-500 bg-stone-800' : 'text-stone-500'}`}><PenTool size={20} /></button>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {renderContent()}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-6 text-center text-stone-600 text-sm">
        <p className="font-serif italic">"The limits of my language mean the limits of my world." — Wittgenstein</p>
      </footer>
    </div>
  );
};

export default App;