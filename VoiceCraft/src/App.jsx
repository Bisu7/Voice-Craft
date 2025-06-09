import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, Mic, Settings, Download } from 'lucide-react';

export default function TextToSpeechApp() {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('female-standard');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);

  // Use ref to hold the Audio object
  const audioRef = useRef(null);

  const voiceOptions = [
    { id: 'female-standard', name: 'Sarah (Female)', type: 'Standard' },
    { id: 'male-standard', name: 'David (Male)', type: 'Standard' },
    { id: 'female-british', name: 'Emma (British)', type: 'Accent' },
    { id: 'male-british', name: 'James (British)', type: 'Accent' },
    { id: 'female-australian', name: 'Olivia (Australian)', type: 'Accent' },
    { id: 'male-deep', name: 'Morgan (Deep)', type: 'Celebrity-like' },
    { id: 'female-smooth', name: 'Scarlett (Smooth)', type: 'Celebrity-like' },
    { id: 'male-energetic', name: 'Ryan (Energetic)', type: 'Celebrity-like' }
  ];

  const handlePlayPause = async () => {
    if (!text.trim()) return;

    if (isPlaying) {
      // If audio is playing, pause it
      audioRef.current?.pause();
      return;
    }

    // If no audio loaded yet, fetch it
    if (!audioRef.current) {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/synthesize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            voice: selectedVoice,
            speed: speed,
            pitch: pitch
          })
        });

        if (!response.ok) throw new Error('Failed to synthesize speech');

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        audioRef.current = new Audio(audioUrl);

        audioRef.current.onplay = () => setIsPlaying(true);
        audioRef.current.onended = () => {
          setIsPlaying(false);
          audioRef.current = null;  // Clear audio after finished
        };
        audioRef.current.onpause = () => setIsPlaying(false);

        audioRef.current.play();
      } catch (error) {
        console.error('Error synthesizing speech:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Audio already loaded, just play it
      audioRef.current.play();
    }
  };

  const handleDownload = async () => {
    if (!text.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/api/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: selectedVoice,
          speed: speed,
          pitch: pitch,
          download: true
        })
      });

      if (!response.ok) throw new Error('Failed to download audio');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'speech.mp3';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading audio:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-10 rounded-full mb-4 backdrop-blur-sm">
            <Volume2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Voice Synthesizer
          </h1>
          <p className="text-white text-opacity-70 text-lg">Transform your text into natural-sounding speech</p>
        </div>

        {/* Main Content */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white border-opacity-20">
          {/* Text Input */}
          <div className="mb-8">
            <label className="block text-white font-semibold mb-3 text-lg">
              Enter Your Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste your text here..."
              className="w-full h-32 p-4 bg-white bg-opacity-5 border border-white border-opacity-20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none backdrop-blur-sm"
              maxLength={1000}
            />
            <div className="text-right text-white text-opacity-50 text-sm mt-2">
              {text.length}/1000 characters
            </div>
          </div>

          {/* Voice Selection */}
          <div className="mb-8">
            <label className="block text-white font-semibold mb-3 text-lg">
              Choose Voice
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {voiceOptions.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice.id)}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    selectedVoice === voice.id
                      ? 'bg-purple-500 bg-opacity-30 border-purple-400 text-white'
                      : 'bg-white bg-opacity-5 border-white border-opacity-20 text-white text-opacity-80 hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Mic className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-medium text-sm">{voice.name}</div>
                      <div className="text-xs opacity-70">{voice.type}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-white font-semibold mb-2">
                Speed: {speed}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-white bg-opacity-20 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 0%, #ec4899 ${((speed - 0.5) / 1.5) * 100}%, rgba(255,255,255,0.2) ${((speed - 0.5) / 1.5) * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">
                Pitch: {pitch}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full h-2 bg-white bg-opacity-20 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 0%, #ec4899 ${((pitch - 0.5) / 1.5) * 100}%, rgba(255,255,255,0.2) ${((pitch - 0.5) / 1.5) * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handlePlayPause}
              disabled={!text.trim() || isLoading}
              className="flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              <span>
                {isLoading ? 'Generating...' : isPlaying ? 'Pause' : 'Play Speech'}
              </span>
            </button>
            
            <button
              onClick={handleDownload}
              disabled={!text.trim()}
              className="flex items-center justify-center space-x-2 px-8 py-4 bg-white bg-opacity-10 text-white font-semibold rounded-xl hover:bg-white hover:bg-opacity-20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-white border-opacity-20"
            >
              <Download className="w-5 h-5" />
              <span>Download Audio</span>
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-10">
            <Volume2 className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="text-white font-semibold mb-2">Natural Voices</h3>
            <p className="text-white text-opacity-70 text-sm">Choose from a variety of realistic AI voices with different accents and styles.</p>
          </div>
          <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-10">
            <Settings className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-white font-semibold mb-2">Customizable</h3>
            <p className="text-white text-opacity-70 text-sm">Adjust speed, pitch, and other parameters to get the perfect voice output.</p>
          </div>
          <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-10">
            <Download className="w-8 h-8 text-green-400 mb-3" />
            <h3 className="text-white font-semibold mb-2">Export Ready</h3>
            <p className="text-white text-opacity-70 text-sm">Download your generated audio in high-quality MP3 format.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
