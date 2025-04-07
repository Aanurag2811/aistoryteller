import React, { useState, useEffect } from 'react';

const genres = [
  'adventure',
  'fantasy',
  'mystery',
  'sci-fi',
  'horror',
  'romance',
  'historical',
  'comedy',
  'poem'
];

const StartStoryForm = ({ onSubmit, loading }) => {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('adventure');
  const [setting, setSetting] = useState('');
  const [placeholder, setPlaceholder] = useState('');

  // Update placeholder text based on selected genre
  useEffect(() => {
    if (genre === 'poem') {
      setPlaceholder('Enter a line or theme for your poem (e.g., "Roses are red", "Twinkle twinkle", "There once was")...');
    } else {
      setPlaceholder('Enter a character, situation, or idea for your story (e.g., "a lost princess searching for her kingdom", "a detective solving a mysterious case")...');
    }
  }, [genre]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ prompt, genre, setting });
  };

  return (
    <div className="p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Genre Selection */}
        <div>
          <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
            Choose a Genre
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {genres.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenre(g)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  genre === g
                    ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            {genre === 'poem' ? 'Enter a line of poetry' : 'Enter a story prompt'}
          </label>
          <div className="relative">
            <input
              type="text"
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={genre === 'poem' 
                ? "Enter a line of poetry to inspire your poem..."
                : "Enter a prompt to start your story..."}
              className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Setting Input */}
        <div>
          <label htmlFor="setting" className="block text-sm font-medium text-gray-700 mb-2">
            Setting (Optional)
          </label>
          <input
            type="text"
            id="setting"
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
            placeholder="Enter a setting (e.g., 'in a magical forest', 'on Mars')"
            className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading || !prompt}
            className={`inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg shadow-sm text-white transition-all duration-200 ease-in-out transform hover:scale-105 ${
              loading || !prompt
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Story
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StartStoryForm; 