import React, { useState, useRef } from 'react';
import { analyzeImage } from '../services/gemini';
import { Upload, Loader2, Image as ImageIcon, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ImageAnalysisPanel: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviewUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear previous results
      setAnalysis('');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const result = await analyzeImage(selectedFile);
      setAnalysis(result.text);
    } catch (error) {
      setAnalysis("Failed to analyze image. Please ensure it is a valid image file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Upload Area */}
        <div className="space-y-4">
          <div 
            className={`border-2 border-dashed rounded-xl h-80 flex flex-col items-center justify-center transition-colors cursor-pointer relative overflow-hidden ${
              selectedFile ? 'border-amber-900/50 bg-stone-900' : 'border-stone-700 bg-stone-800/30 hover:bg-stone-800/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center p-6">
                <Upload className="mx-auto text-stone-500 mb-4" size={32} />
                <p className="text-stone-400 font-medium">Click to upload an image</p>
                <p className="text-stone-600 text-sm mt-2">Supports JPG, PNG, WebP</p>
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>
          
          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || loading}
            className="w-full bg-amber-900/80 hover:bg-amber-800 text-amber-50 py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Analyzing...
              </>
            ) : (
              <>
                <ImageIcon size={20} />
                Analyze & Interpret
              </>
            )}
          </button>
          
          <p className="text-xs text-stone-500 text-center px-4">
            * Uploads containing text will be translated. Images without text will be interpreted philosophically, rewriting visual elements into terms.
          </p>
        </div>

        {/* Result Area */}
        <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-6 flex flex-col h-full min-h-[400px]">
          <h3 className="text-xl font-serif text-amber-100 mb-4 flex items-center gap-2">
            <FileText size={20} />
            Analysis Result
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {analysis ? (
               <div className="prose prose-invert prose-amber max-w-none font-serif text-stone-200 leading-relaxed">
                 <ReactMarkdown>{analysis}</ReactMarkdown>
               </div>
            ) : (
              <div className="h-full flex items-center justify-center text-stone-600 italic text-center p-4">
                {loading 
                  ? "Consulting the archives..." 
                  : "Upload an image to reveal its philosophical significance."}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImageAnalysisPanel;