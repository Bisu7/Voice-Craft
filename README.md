# Voice‑Craft

> A real-time **Text-to-Speech (TTS)** web application built using **React** and **Flask**, enabling lifelike audio synthesis from short text inputs.

## 🔊 Overview

Voice‑Craft is a speech synthesis platform that converts user-provided text into realistic audio within **1.2 seconds**, enabling instant voice playback and download. It features seamless interaction between the frontend and backend using non-blocking API calls and delivers a smooth, responsive user interface.

## 🚀 Key Features

- ⚡ **Real-time TTS conversion** with ultra-low latency
- 🔄 **Non-blocking API communication** for uninterrupted playback
- 🎧 **Playback controls** – play, pause, stop
- 💾 **Audio download support** for generated voice clips
- 🖥️ **Modern UI** with smooth transitions and responsive design

## 🧩 Tech Stack

| Layer     | Technology     |
|-----------|----------------|
| Frontend  | React.js       |
| Backend   | Flask (Python) |
| Audio     | pyttsx3 / TTS engine |
| Styling   | CSS / JS       |


## 🗂️ Project Structure

Voice‑Craft/

├── Backend/ # Flask app with TTS engine and API endpoints

└── Frontend/ # React UI for text input and audio playback



## ⚙️ Setup Instructions

### 1️⃣ Backend Setup (Flask)

```bash
cd Backend/
pip install -r requirements.txt

# Start the Flask server
python app.py
```

2️⃣ Frontend Setup (React)
```
cd Frontend/
npm install
npm start
React app runs on http://localhost:3000 by default. Ensure it points to the Flask backend (http://localhost:5000 or as configured).
```

🧪 How to Use

Open the app in your browser.

Enter short text in the input field.

Click Convert to generate voice.

Use Play / Pause / Download controls to interact with the audio.

🌐 API Overview

POST /speak – Accepts JSON with text input and returns generated audio

GET /health – Optional health check for backend status



📌 Project Summary
Voice‑Craft is designed to deliver fast, natural-sounding voice from text inputs using modern web technologies. It’s ideal for quick prototyping, accessibility tools, or embedded voice features in applications.
