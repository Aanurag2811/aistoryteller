import React, { useState } from 'react';

const StoryInput = ({ onSubmit, onReset, loading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() === '') return;
    
    onSubmit(input);
    setInput('');
  };

  return (
    <div className="mt-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="userInput" className="block text-sm font-medium text-gray-700 mb-1">
            What do you want to do next?
          </label>
          <textarea
            id="userInput"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your response or action..."
            className="input-field h-24"
            disabled={loading}
          />
        </div>
        
        <div className="flex space-x-4">
          <button
            type="submit"
            className="button-primary flex-1"
            disabled={loading || input.trim() === ''}
          >
            Continue Story
          </button>
          
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            disabled={loading}
          >
            Start New Story
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoryInput; 