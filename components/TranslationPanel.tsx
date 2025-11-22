import React, { useState } from 'react';
import { translateText, defineTerm } from '../services/gemini';
import { TranslationSpeed } from '../types';
import { Loader2, BookOpen, Zap, BrainCircuit, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const TranslationPanel: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [speed, setSpeed] = useState<TranslationSpeed>(TranslationSpeed.DEEP);
  const [loading, setLoading] = useState(false);
  const [termQuery, setTermQuery] = useState('');
  const [termDefinition, setTermDefinition] = useState<{text: string, urls: string[]} | null>(null);
  const [definingTerm, setDefiningTerm] = useState(false);

  const handleTranslate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutput('');
    try {
      const result = await translateText(input, speed);
      setOutput(result.translation);
    } catch (error) {
      setOutput("An error occurred during translation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDefineTerm = async () => {
    if (!termQuery.trim()) return;
    setDefiningTerm(true);
    try {
      const result = await defineTerm(termQuery);
      setTermDefinition({ text: result.definition || "No definition found.", urls: result.urls });
    } catch (e) {
      setTermDefinition({ text: "Error fetching definition.", urls: [] });
    } finally {
      setDefiningTerm(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Translation Area */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-stone-900/50 border border-stone-800 p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-serif text-amber-100 flex items-center gap-2">
              <BookOpen size={20} />
              Source Text
            </h2>
            <div className="flex bg-stone-800 rounded-lg p-1">
              <button
                onClick={() => setSpeed(TranslationSpeed.FAST)}
                className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors ${
                  speed === TranslationSpeed.FAST 
                    ? 'bg-stone-700 text-amber-100 shadow-sm' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Zap size={14} />
                Fast
              </button>
              <button
                onClick={() => setSpeed(TranslationSpeed.DEEP)}
                className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors ${
                  speed === TranslationSpeed.DEEP 
                    ? 'bg-stone-700 text-amber-100 shadow-sm' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <BrainCircuit size={14} />
                Deep Thinking
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter philosophical text here..."
            className="w-full h-40 bg-stone-800/50 border border-stone-700 rounded-lg p-4 text-stone-200 placeholder-stone-500 focus:ring-1 focus:ring-amber-900/50 focus:border-amber-800 outline-none resize-none font-serif text-lg leading-relaxed"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleTranslate}
              disabled={loading || !input.trim()}
              className="bg-amber-900/80 hover:bg-amber-800 text-amber-50 px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Translate'}
            </button>
          </div>
        </div>

        {/* Output Area */}
        <div className="bg-stone-900/50 border border-stone-800 p-6 rounded-xl min-h-[200px]">
           <h2 className="text-xl font-serif text-amber-100 mb-4">Translation</h2>
           {output ? (
             <div className="prose prose-invert prose-amber max-w-none font-serif text-lg leading-relaxed text-stone-200">
               <ReactMarkdown>{output}</ReactMarkdown>
             </div>
           ) : (
             <div className="h-full flex items-center justify-center text-stone-600 italic">
               Translation will appear here...
             </div>
           )}
        </div>
      </div>

      {/* Sidebar: Term Lookup */}
      <div className="space-y-6">
        <div className="bg-stone-800/30 border border-stone-800 p-4 rounded-xl h-full">
          <h3 className="text-lg font-medium text-stone-300 mb-4 flex items-center gap-2">
            <Search size={18} />
            Term Lookup
          </h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={termQuery}
              onChange={(e) => setTermQuery(e.target.value)}
              placeholder="e.g., Zeitgeist"
              className="flex-1 bg-stone-900 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-amber-800"
              onKeyDown={(e) => e.key === 'Enter' && handleDefineTerm()}
            />
            <button 
              onClick={handleDefineTerm}
              disabled={definingTerm}
              className="bg-stone-700 hover:bg-stone-600 text-stone-200 p-2 rounded-md disabled:opacity-50"
            >
              {definingTerm ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
            </button>
          </div>

          {termDefinition && (
            <div className="bg-stone-900/50 p-4 rounded-lg border border-stone-700/50">
              <div className="prose prose-sm prose-invert text-stone-300 font-serif">
                <ReactMarkdown>{termDefinition.text}</ReactMarkdown>
              </div>
              {termDefinition.urls.length > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-700/50">
                  <p className="text-xs text-stone-500 mb-2">Sources:</p>
                  <ul className="space-y-1">
                    {termDefinition.urls.slice(0, 3).map((url, i) => (
                      <li key={i}>
                        <a href={url} target="_blank" rel="noreferrer" className="text-xs text-amber-700 hover:text-amber-600 truncate block">
                          {new URL(url).hostname}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {!termDefinition && (
            <p className="text-sm text-stone-500 text-center mt-10">
              Search for philosophical terms to get grounded definitions utilizing Google Search.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranslationPanel;