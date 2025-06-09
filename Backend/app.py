from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pyttsx3
import tempfile
import os
import io
import wave
import threading
import time
import struct

app = Flask(__name__)
CORS(app)

# Voice configuration mapping
VOICE_CONFIG = {
    'female-standard': {'rate': 200, 'voice_id': 0, 'pitch': 50},
    'male-standard': {'rate': 180, 'voice_id': 1, 'pitch': 30},
    'female-british': {'rate': 190, 'voice_id': 0, 'pitch': 55},
    'male-british': {'rate': 175, 'voice_id': 1, 'pitch': 35},
    'female-australian': {'rate': 185, 'voice_id': 0, 'pitch': 52},
    'male-deep': {'rate': 160, 'voice_id': 1, 'pitch': 20},
    'female-smooth': {'rate': 170, 'voice_id': 0, 'pitch': 45},
    'male-energetic': {'rate': 220, 'voice_id': 1, 'pitch': 40}
}

class TTSEngine:
    def __init__(self):
        self.engine = None
        self.temp_files = []
    
    def initialize_engine(self):
        """Initialize the TTS engine"""
        try:
            self.engine = pyttsx3.init()
            return True
        except Exception as e:
            print(f"Error initializing TTS engine: {e}")
            return False
    
    def get_available_voices(self):
        """Get list of available voices"""
        if not self.engine:
            if not self.initialize_engine():
                return []
        
        voices = self.engine.getProperty('voices')
        return [{'id': i, 'name': voice.name} for i, voice in enumerate(voices)]
    
    def synthesize_speech(self, text, voice_config, speed=1.0, pitch=1.0):
        """Convert text to speech with given parameters"""
        if not self.engine:
            if not self.initialize_engine():
                return None
        
        try:
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            temp_file.close()
            
            # Configure voice
            voices = self.engine.getProperty('voices')
            if voice_config['voice_id'] < len(voices):
                self.engine.setProperty('voice', voices[voice_config['voice_id']].id)
            
            # Set rate (words per minute) - combine speed adjustment here
            base_rate = voice_config['rate']
            adjusted_rate = int(base_rate * speed)
            self.engine.setProperty('rate', adjusted_rate)
            
            # Set volume
            self.engine.setProperty('volume', 0.9)
            
            # Save to file
            self.engine.save_to_file(text, temp_file.name)
            self.engine.runAndWait()
            
            # Simple pitch adjustment by modifying the WAV file directly
            if pitch != 1.0:
                self.adjust_pitch_simple(temp_file.name, pitch)
            
            self.temp_files.append(temp_file.name)
            return temp_file.name
            
        except Exception as e:
            print(f"Error synthesizing speech: {e}")
            return None
    
    def adjust_pitch_simple(self, wav_file, pitch_factor):
        """Simple pitch adjustment by changing sample rate"""
        try:
            with wave.open(wav_file, 'rb') as wav_in:
                params = wav_in.getparams()
                frames = wav_in.readframes(params.nframes)
            
            # Adjust sample rate to change pitch
            new_sample_rate = int(params.framerate * pitch_factor)
            
            # Write back with new sample rate
            with wave.open(wav_file, 'wb') as wav_out:
                wav_out.setparams((
                    params.nchannels,
                    params.sampwidth,
                    new_sample_rate,
                    params.nframes,
                    params.comptype,
                    params.compname
                ))
                wav_out.writeframes(frames)
                
        except Exception as e:
            print(f"Error adjusting pitch: {e}")
    
    def cleanup_temp_files(self):
        """Clean up temporary files"""
        for file_path in self.temp_files:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Error removing temp file {file_path}: {e}")
        self.temp_files.clear()

# Global TTS engine instance
tts_engine = TTSEngine()

@app.route('/api/voices', methods=['GET'])
def get_voices():
    """Get available voices"""
    voices = tts_engine.get_available_voices()
    return jsonify({
        'voices': voices,
        'voice_options': [
            {'id': 'female-standard', 'name': 'Sarah (Female)', 'type': 'Standard'},
            {'id': 'male-standard', 'name': 'David (Male)', 'type': 'Standard'},
            {'id': 'female-british', 'name': 'Emma (British)', 'type': 'Accent'},
            {'id': 'male-british', 'name': 'James (British)', 'type': 'Accent'},
            {'id': 'female-australian', 'name': 'Olivia (Australian)', 'type': 'Accent'},
            {'id': 'male-deep', 'name': 'Morgan (Deep)', 'type': 'Celebrity-like'},
            {'id': 'female-smooth', 'name': 'Scarlett (Smooth)', 'type': 'Celebrity-like'},
            {'id': 'male-energetic', 'name': 'Ryan (Energetic)', 'type': 'Celebrity-like'}
        ]
    })

@app.route('/api/synthesize', methods=['POST'])
def synthesize_speech():
    """Synthesize speech from text"""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
        
        text = data['text'].strip()
        if not text:
            return jsonify({'error': 'Text cannot be empty'}), 400
        
        if len(text) > 1000:
            return jsonify({'error': 'Text too long (max 1000 characters)'}), 400
        
        # Get parameters
        voice_id = data.get('voice', 'female-standard')
        speed = float(data.get('speed', 1.0))
        pitch = float(data.get('pitch', 1.0))
        is_download = data.get('download', False)
        
        # Validate parameters
        if voice_id not in VOICE_CONFIG:
            voice_id = 'female-standard'
        
        speed = max(0.5, min(2.0, speed))
        pitch = max(0.5, min(2.0, pitch))
        
        # Get voice configuration
        voice_config = VOICE_CONFIG[voice_id]
        
        # Synthesize speech
        audio_file = tts_engine.synthesize_speech(text, voice_config, speed, pitch)
        
        if not audio_file:
            return jsonify({'error': 'Failed to synthesize speech'}), 500
        
        # Return WAV file directly (no MP3 conversion to avoid pydub dependency)
        return send_file(
            audio_file,
            mimetype='audio/wav',
            as_attachment=is_download,
            download_name='speech.wav'
        )
        
    except Exception as e:
        print(f"Error in synthesize_speech: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'tts_available': tts_engine.engine is not None or tts_engine.initialize_engine()
    })

@app.route('/api/cleanup', methods=['POST'])
def cleanup_files():
    """Clean up temporary files"""
    try:
        tts_engine.cleanup_temp_files()
        return jsonify({'message': 'Cleanup completed'})
    except Exception as e:
        return jsonify({'error': f'Cleanup failed: {e}'}), 500

# Background task to periodically clean up old temp files
def periodic_cleanup():
    while True:
        time.sleep(300)  # Clean up every 5 minutes
        tts_engine.cleanup_temp_files()

# Start cleanup thread
cleanup_thread = threading.Thread(target=periodic_cleanup, daemon=True)
cleanup_thread.start()

if __name__ == '__main__':
    print("Starting Text-to-Speech API Server...")
    print("Available endpoints:")
    print("  GET  /api/voices     - Get available voices")
    print("  POST /api/synthesize - Synthesize speech from text")
    print("  GET  /api/health     - Health check")
    print("  POST /api/cleanup    - Clean up temporary files")
    
    app.run(host='0.0.0.0', port=5000, debug=True)