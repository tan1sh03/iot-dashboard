// src/components/VoiceRecognition.js
import React, { useState } from 'react';
import axios from 'axios';

const VoiceRecognition = () => {
  const [transcript, setTranscript] = useState('');
  const recognition = new window.webkitSpeechRecognition(); // WebkitSpeechRecognition for Chrome

  recognition.lang = 'en-US';
  recognition.onresult = (event) => {
    setTranscript(event.results[0][0].transcript);
    sendCommandToChatGPT(event.results[0][0].transcript);
  };

  const startListening = () => {
    recognition.start();
  };

  const sendCommandToChatGPT = async (command) => {
    try {
      const response = await axios.post('http://localhost:3001/api/chatbot', { command });
      console.log('ChatGPT Response:', response.data);
    } catch (error) {
      console.error('Error sending voice command:', error);
    }
  };

  return (
    <div className="voice-recognition">
      <button onClick={startListening}>Start Voice Command</button>
      {transcript && <p>Transcript: {transcript}</p>}
    </div>
  );
};

export default VoiceRecognition;
