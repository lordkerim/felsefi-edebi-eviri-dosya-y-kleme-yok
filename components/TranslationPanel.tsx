import React, { useState, useRef } from 'react';
import { translateContent, defineTerm } from '../services/gemini';
import { TranslationSpeed } from '../types';
import { Loader2, BookOpen, Zap, BrainCircuit, Search, Upload, FileText, X, Paperclip, Download, FileType } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const TranslationPanel: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [speed, setSpeed] = useState<TranslationSpeed>(TranslationSpeed.DEEP);
  const [loading, setLoading] = useState(false);
  const [termQuery, setTermQuery] = useState('');
  const [termDefinition, setTermDefinition] = useState<{text: string, urls: string[]} | null>(null);
  const [definingTerm, setDefiningTerm] = useState(false);
  
  // File attachment state (mainly for PDF/Images)
  const [attachment, setAttachment] = useState<{data: string, mimeType: string, name: string} | null>(null);
  const [sourceFormat, setSourceFormat] = useState<'text' | 'pdf' | 'docx'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTranslate = async () => {
    if (!input.trim() && !attachment) return;
    setLoading(true);
    setOutput('');
    try {
      // Remove data prefix from base64 if it exists in attachment before sending to service
      // The service expects raw base64 in 'data'
      let serviceAttachment = null;
      if (attachment) {
          serviceAttachment = {
              mimeType: attachment.mimeType,
              data: attachment.data.split(',')[1] || attachment.data
          };
      }

      const result = await translateContent(input, serviceAttachment, speed);
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Determine source format for later download
      if (file.type === 'application/pdf') setSourceFormat('pdf');
      else if (file.name.match(/\.docx$/i)) setSourceFormat('docx');
      else setSourceFormat('text');

      // Support PDF and Images (JPG, PNG, etc.)
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              const res = ev.target?.result as string;
              setAttachment({
                  data: res,
                  mimeType: file.type,
                  name: file.name
              });
              setInput(''); // Clear text input if replacing with a binary file
          };
          reader.readAsDataURL(file);
      } else if (file.name.match(/\.docx$/i)) {
          // Use mammoth to extract text
          try {
              const arrayBuffer = await file.arrayBuffer();
              if ((window as any).mammoth) {
                const result = await (window as any).mammoth.extractRawText({ arrayBuffer });
                setInput(result.value);
                // For DOCX, we keep the text content but also allow "DOCX" download mode.
                // We do NOT set attachment for Gemini here because we extracted text.
                // If we wanted Gemini to see the DOCX binary, we would treat it like PDF.
                // However, Gemini works well with text.
                // To preserve format on output, we will regenerate a DOCX from the output text.
                setAttachment(null); 
                setSourceFormat('docx');
              } else {
                alert("Document processor not ready. Please try again in a moment.");
              }
          } catch (err) {
              console.error("Error parsing DOCX", err);
              alert("Failed to read DOCX file. Please ensure it is a valid Word document.");
          }
      } else if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|json)$/i)) {
          const text = await file.text();
          setInput(text);
          setAttachment(null);
      } else {
          alert("Unsupported file type. Please upload PDF, DOCX, Text, or Image files.");
      }
      
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearAttachment = () => {
      setAttachment(null);
      setSourceFormat('text');
  };

  const handleDownload = () => {
    if (!output) return;

    const filename = `translation-${Date.now()}`;

    if (sourceFormat === 'docx' && (window as any).docx && (window as any).saveAs) {
        // Generate DOCX
        const { Document, Packer, Paragraph, TextRun } = (window as any).docx;
        
        // Split by paragraphs (basic splitting by newline)
        const paragraphs = output.split('\n').map((line) => new Paragraph({
            children: [new TextRun(line)],
            spacing: { after: 200 }
        }));

        const doc = new Document({
            sections: [{
                properties: {},
                children: paragraphs,
            }],
        });

        Packer.toBlob(doc).then((blob: Blob) => {
            (window as any).saveAs(blob, `${filename}.docx`);
        });

    } else if (sourceFormat === 'pdf' && (window as any).pdfMake) {
        // Generate PDF
        const docDefinition = {
            content: [
                { text: 'Translation', style: 'header' },
                { text: output, style: 'body' }
            ],
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
                body: { fontSize: 12, lineHeight: 1.5 }
            }
        };
        (window as any).pdfMake.createPdf(docDefinition).download(`${filename}.pdf`);

    } else {
        // Fallback to text file
        const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
        if ((window as any).saveAs) {
            (window as any).saveAs(blob, `${filename}.txt`);
        } else {
             // Basic fallback
             const url = URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = url;
             a.download = `${filename}.txt`;
             a.click();
        }
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
              Source Material
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
          
          <div className="relative">
             {attachment && (
                 <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-stone-800 text-amber-100 px-3 py-1.5 rounded-md shadow-md border border-stone-700 animate-in fade-in slide-in-from-top-2">
                     <FileText size={14} className="text-amber-500" />
                     <span className="text-xs max-w-[200px] truncate font-medium">{attachment.name}</span>
                     <button onClick={clearAttachment} className="hover:text-red-400 ml-1 p-1">
                         <X size={14} />
                     </button>
                 </div>
             )}
             
             <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={attachment ? "Add any specific context or instructions for translating the attached document..." : "Type or paste philosophical text here, or upload a file (PDF, DOCX, Image)..."}
                className="w-full h-48 bg-stone-800/50 border border-stone-700 rounded-lg p-4 text-stone-200 placeholder-stone-500 focus:ring-1 focus:ring-amber-900/50 focus:border-amber-800 outline-none resize-none font-serif text-lg leading-relaxed"
            />
          </div>

          <div className="mt-4 flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept=".pdf,.docx,.txt,.md,text/*,image/*"
                    onChange={handleFileSelect}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex items-center gap-2 text-stone-400 hover:text-amber-100 transition-colors px-3 py-2 rounded-lg hover:bg-stone-800/50 border border-transparent hover:border-stone-700"
                    title="Upload PDF, DOCX, Text, or Image"
                >
                    <Paperclip size={18} className="group-hover:stroke-amber-400 transition-colors" />
                    <span className="text-sm font-medium">Upload File</span>
                </button>
                <span className="text-xs text-stone-600 hidden sm:inline-block border-l border-stone-800 pl-3">
                  Supports PDF, DOCX, JPG, TXT
                </span>
            </div>

            <button
              onClick={handleTranslate}
              disabled={loading || (!input.trim() && !attachment)}
              className="bg-amber-900/80 hover:bg-amber-800 text-amber-50 px-8 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg shadow-black/20"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Translate'}
            </button>
          </div>
        </div>

        {/* Output Area */}
        <div className="bg-stone-900/50 border border-stone-800 p-6 rounded-xl min-h-[250px] relative">
           <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-serif text-amber-100">Translation</h2>
               {output && (
                   <button 
                    onClick={handleDownload}
                    className="text-stone-400 hover:text-amber-100 transition-colors flex items-center gap-2 text-sm bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-700"
                   >
                       {sourceFormat === 'pdf' ? <FileType size={14} /> : sourceFormat === 'docx' ? <FileText size={14} /> : <Download size={14} />}
                       Download as {sourceFormat.toUpperCase()}
                   </button>
               )}
           </div>
           
           {output ? (
             <div className="prose prose-invert prose-amber max-w-none font-serif text-lg leading-relaxed text-stone-200">
               <ReactMarkdown>{output}</ReactMarkdown>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-stone-600 italic gap-2 py-10">
               <BookOpen size={32} className="opacity-20" />
               <span>Translation will appear here...</span>
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
            <div className="bg-stone-900/50 p-4 rounded-lg border border-stone-700/50 animate-in fade-in">
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
            <p className="text-sm text-stone-500 text-center mt-10 px-4">
              Search for philosophical terms to get grounded definitions utilizing Google Search.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranslationPanel;