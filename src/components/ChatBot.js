// src/components/ChatBot.js
import React, { useState } from 'react';
import axios from 'axios';

const ChatBot = () => {
  const [command, setCommand] = useState('');
  const [response, setResponse] = useState('');

  const handleSubmit = async () => {
    try {
      const result = await axios.post('http://localhost:3001/api/chatbot', { command });
      setResponse(result.data.response);
    } catch (error) {
      console.error('Error sending command to ChatGPT:', error);
    }
  };

  return (
    <div className="chatbot-container">
      <h3>Chat with your Smart Home</h3>
      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Enter your command (e.g., Turn on the kitchen light)"
      />
      <button onClick={handleSubmit}>Send</button>
      {response && <p>Response: {response}</p>}
    </div>
  );
};

export default ChatBot;