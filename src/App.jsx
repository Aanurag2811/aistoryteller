import { useState } from 'react'
import StoryContainer from './components/StoryContainer'
import StartStoryForm from './components/StartStoryForm'
import './App.css'

function App() {
  const [storyId, setStoryId] = useState(null)
  const [storyContent, setStoryContent] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Function to start a new story based on form input
  const handleStartStory = async (formData) => {
    try {
      setLoading(true);
      setStoryContent([]);
      
      // Try to fetch from ports 3002, 3003, etc. until one succeeds
      const ports = [3002, 3003, 3004, 3005, 30021];
      let response = null;
      let success = false;
      
      for (const port of ports) {
        try {
          const fetchResponse = await fetch(`https://aistoryteller-rho.vercel.app/api/story/start`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          });
          
          if (fetchResponse.ok) {
            response = fetchResponse;
            success = true;
            console.log(`Successfully connected to server on port ${port}`);
            break;
          }
        } catch (e) {
          console.log(`Failed to connect to port ${port}, trying next...`);
          // Continue to next port
        }
      }
      
      if (!success || !response) {
        throw new Error('Failed to connect to any server port');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStoryId(data.storyId);
        setStoryContent([data.content]);
      } else {
        console.error('Error starting story:', data.error);
        setStoryContent(['Sorry, there was an error creating your story. Please try again.']);
      }
    } catch (error) {
      console.error('Error generating story:', error);
      setStoryContent(['Sorry, there was an error creating your story. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  // Function to reset the story
  const resetStory = () => {
    setStoryId(null)
    setStoryContent([])
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 animate-gradient"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
              AI Storyteller
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Create magical stories, poems, and adventures with the power of AI
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button 
                  onClick={() => setError(null)} 
                  className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {!storyId ? (
            <StartStoryForm onSubmit={handleStartStory} loading={loading} />
          ) : (
            <div className="p-6">
              <StoryContainer 
                storyContent={storyContent} 
                loading={loading} 
              />
              
              <div className="mt-8 flex justify-center">
                <button
                  onClick={resetStory}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                  Create New Story
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
