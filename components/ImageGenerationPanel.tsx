import React, { useState } from 'react';
import { generatePhilosophicalImage, ensureApiKeySelected } from '../services/gemini';
import { ImageSize } from '../types';
import { Loader2, Palette, Download, AlertCircle } from 'lucide-react';

const ImageGenerationPanel: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>(ImageSize.SIZE_1K);
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // Ensure API key for high-compute model
      await ensureApiKeySelected();
      
      const imageUrl = await generatePhilosophicalImage(prompt, size);
      setGeneratedImage(imageUrl);
    } catch (e: any) {
      console.error(e);
      // Handle specific error for "Requested entity was not found" -> Retry key selection
      if (e.message?.includes("Requested entity was not found")) {
         setError("Authentication failed. Please try selecting the API key again.");
         // Optionally trigger key selection again immediately, but user feedback is better first.
      } else {
         setError("Failed to generate image. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
      try {
          await ensureApiKeySelected();
      } catch (e) {
          console.error("Auth failed", e);
      }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <div className="bg-stone-900/50 border border-stone-800 p-6 rounded-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-serif text-amber-100 flex items-center gap-2 mb-1">
              <Palette size={20} />
              Visual Synthesis
            </h2>
            <p className="text-stone-400 text-sm">Generate high-fidelity imagery representing philosophical concepts.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <select 
               value={size}
               onChange={(e) => setSize(e.target.value as ImageSize)}
               className="bg-stone-800 border border-stone-700 text-stone-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-800"
             >
               <option value={ImageSize.SIZE_1K}>1K Resolution</option>
               <option value={ImageSize.SIZE_2K}>2K Resolution</option>
               <option value={ImageSize.SIZE_4K}>4K Resolution</option>
             </select>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the philosophical concept to visualize (e.g., 'The allegory of the cave', 'Sisyphus pushing the boulder')..."
            className="w-full h-32 bg-stone-800/50 border border-stone-700 rounded-lg p-4 text-stone-200 placeholder-stone-500 focus:ring-1 focus:ring-amber-900/50 focus:border-amber-800 outline-none resize-none font-serif"
          />
          
          <div className="flex items-center justify-between">
            <button 
               type="button"
               onClick={handleAuthorize}
               className="text-xs text-stone-500 underline hover:text-stone-400"
            >
               Reset/Select API Key
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="bg-amber-900/80 hover:bg-amber-800 text-amber-50 px-8 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-900/50 text-red-200 p-4 rounded-lg flex items-center gap-3">
           <AlertCircle size={20} />
           {error}
        </div>
      )}

      {/* Output Display */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-2 min-h-[400px] flex items-center justify-center relative overflow-hidden">
        {generatedImage ? (
          <div className="relative w-full h-full group">
            <img 
              src={generatedImage} 
              alt="Generated Visualization" 
              className="w-full h-auto max-h-[600px] object-contain mx-auto rounded-lg shadow-2xl"
            />
            <a 
              href={generatedImage} 
              download={`philosophical-viz-${Date.now()}.png`}
              className="absolute top-4 right-4 bg-stone-900/80 hover:bg-stone-900 text-stone-200 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Download"
            >
              <Download size={20} />
            </a>
          </div>
        ) : (
          <div className="text-stone-600 italic flex flex-col items-center gap-2">
             <Palette size={48} className="opacity-20" />
             <span>Visualization awaits your prompt.</span>
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 bg-stone-900/80 flex flex-col items-center justify-center z-10">
            <Loader2 className="animate-spin text-amber-500 mb-4" size={48} />
            <p className="text-amber-100 font-serif animate-pulse">Synthesizing visual philosophy...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerationPanel;