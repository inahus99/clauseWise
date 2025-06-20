
import React, { useState } from 'react';
import { UploadCloud, FileText, Lightbulb, AlertTriangle, LoaderCircle, Sparkles } from 'lucide-react';

const ClauseCard = ({ category, clause, explanation, index }) => {
    const colors = [
        'border-l-purple-500', 'border-l-pink-500', 'border-l-blue-500',
        'border-l-teal-500', 'border-l-sky-500', 'border-l-rose-500'
    ];
    const cardColor = colors[index % colors.length];

    return (
        <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700 hover:border-purple-500/80 transition-all duration-300 transform hover:-translate-y-1 ${cardColor} border-l-4`}>
            <div className="p-6">
                <div className="flex items-center mb-4">
                    <Lightbulb className="h-6 w-6 text-yellow-400 mr-3" />
                    <h3 className="text-lg font-bold text-slate-200 uppercase tracking-wider">{category}</h3>
                </div>
                <div className="mb-4">
                    <h4 className="font-semibold text-slate-300 mb-2">Simplified Explanation:</h4>
                    <p className="text-slate-400">{explanation}</p>
                </div>
                <div className="bg-slate-900/70 p-4 rounded-md mt-4 border border-slate-700">
                    <h4 className="font-semibold text-slate-300 mb-2">Original Clause:</h4>
                    <p className="text-sm text-slate-500 italic font-mono">"{clause}"</p>
                </div>
            </div>
        </div>
    );
};

export default function App() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [clauses, setClauses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            setSelectedFile(file);
            setFileName(file.name);
            setError('');
            setClauses([]);
        } else {
            setError("Please select a valid PDF file.");
            setSelectedFile(null);
            setFileName('');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!selectedFile) {
            setError("Please select a file before analyzing.");
            return;
        }

        setIsLoading(true);
        setError('');
        setClauses([]);

        const formData = new FormData();
        formData.append('pdf', selectedFile);

        try {
            const response = await fetch('http://localhost:8888/api/analyze', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong on the server.');
            }

            setClauses(data.clauses);

        } catch (err) {
            console.error("Frontend Error:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-purple-500/30 overflow-x-hidden">
            <div className="absolute top-0 left-0 right-0 h-full bg-grid-slate-800/[0.2] [mask-image:linear-gradient(to_bottom,white_5%,transparent_100%)]"></div>
            
            <header className="bg-slate-900/70 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center">
                    <Sparkles className="h-10 w-10 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500" />
                    <div className="ml-4">
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">ClauseWise</h1>
                        <p className="text-sm text-slate-500 -mt-1">Your AI Legal Assistant</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl shadow-purple-900/10 border border-slate-700">
                    <h2 className="text-4xl font-bold text-slate-100 mb-2">Simplify Your Legal Documents</h2>
                    <p className="text-slate-400 mb-8 max-w-2xl">Let AI do the heavy lifting. Upload any legal PDF to instantly extract and understand the clauses that matter most.</p>

                    <form onSubmit={handleSubmit}>
                        <div className="mt-4 flex justify-center rounded-xl border-2 border-dashed border-slate-600 hover:border-purple-500 transition-colors duration-300 px-6 py-10 bg-slate-900/40">
                            <div className="text-center">
                                <UploadCloud className="mx-auto h-12 w-12 text-slate-500" aria-hidden="true" />
                                <div className="mt-4 flex text-sm leading-6 text-slate-400">
                                    <label
                                        htmlFor="file-upload"
                                        className="relative cursor-pointer rounded-md font-semibold text-purple-400 focus-within:outline-none hover:text-pink-400 transition-colors duration-300"
                                    >
                                        <span>Select a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs leading-5 text-slate-500">PDF up to 10MB</p>
                                {fileName && <p className="text-sm mt-2 text-green-400 font-medium">{fileName}</p>}
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={isLoading || !selectedFile}
                                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-purple-500/40 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:bg-slate-700 disabled:from-slate-700 disabled:to-slate-700 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {isLoading && <LoaderCircle className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />}
                                {isLoading ? 'Analyzing...' : 'Analyze Document'}
                            </button>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="mt-12 bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-xl flex items-center" role="alert">
                         <AlertTriangle className="h-6 w-6 mr-3"/>
                        <div>
                            <p className="font-bold">An Error Occurred</p>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                {clauses.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-3xl font-bold text-slate-100 mb-8 text-center">Analysis Results</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {clauses.map((item, index) => (
                                <ClauseCard key={index} index={index} {...item} />
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
