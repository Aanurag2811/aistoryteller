import React, { useState, useEffect, useRef } from 'react';

const StoryContainer = ({ storyContent, loading }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentVoice, setCurrentVoice] = useState(null);
  const storyRef = useRef(null);
  
  // Load available voices when component mounts
  useEffect(() => {
    // Initialize speech synthesis
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => voice.name.includes('Female'));
    setCurrentVoice(femaleVoice || voices[0]);
  }, []);
  
  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
    } else {
      const text = storyContent.join('\n\n');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = currentVoice;
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
    setIsSpeaking(!isSpeaking);
  };
  
  useEffect(() => {
    // Scroll to bottom when new content is added
    if (storyRef.current) {
      storyRef.current.scrollTop = storyRef.current.scrollHeight;
    }
  }, [storyContent]);
  
  return (
    <div className="relative">
      {/* Story Content */}
      <div 
        ref={storyRef}
        className="story-text prose prose-lg max-w-none px-4 py-6 bg-white rounded-lg shadow-inner overflow-y-auto max-h-[60vh] pb-16"
      >
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          storyContent.map((paragraph, index) => (
            <p 
              key={index}
              className="mb-4 text-gray-700 leading-relaxed animate-fade-in"
            >
              {paragraph}
            </p>
          ))
        )}
      </div>
      
      {/* Read Aloud Button */}
      <button
        onClick={handleSpeak}
        className="absolute bottom-4 right-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out transform hover:scale-105"
      >
        {isSpeaking ? (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Stop Reading
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Read Aloud
          </>
        )}
      </button>
    </div>
  );
};

export default StoryContainer; 