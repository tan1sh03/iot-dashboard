import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {DoorClosed, Blinds, Waves, Microwave, Home, Thermometer, Droplets, Zap, Speaker, Camera, Coffee, Tv, Bed, Car, Mic, Send, StopCircle, Lightbulb, Fan, Store } from 'lucide-react';

// Utility Components
const DashboardCard = ({ title, children }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    {children}
  </div>
);

const ToggleSwitch = ({ label, isOn, onToggle }) => (
  <div className="flex items-center justify-between">
    <span>{label}</span>
    <button
      className={`w-12 h-6 rounded-full p-1 ${isOn ? 'bg-blue-600' : 'bg-gray-300'}`}
      onClick={onToggle}
    >
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${isOn ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
);

const Chatbot = ({ devices, setDevices }) => {
  const [messages, setMessages] = useState([
    { 
      text: "Hello! I'm your smart home AI assistant. I can help you control your devices and chat with you about anything! Try asking me something or give me a command like 'Turn on the living room lights'.", 
      isBot: true 
    }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDeviceCommand = (parsedCommand) => {
    if (!parsedCommand || !parsedCommand.room || !parsedCommand.device) {
      return;
    }
    
    const deviceMapping = {
      'Smart Lights': 'Smart Lights',
      'TV': 'TV',
      'Air Conditioner': 'Air Conditioner',
      'Air Purifier': 'Air Purifier',
      'Smart Curtains': 'Smart Curtains',
      'Smart Oven': 'Smart Oven',
      'Coffee Maker': 'Coffee Maker',
      'Refrigerator': 'Refrigerator',
      'Garage Door': 'Garage Door',
      'Security Camera': 'Security Camera',
      'EV Charger': 'EV Charger'
    };

    const device = deviceMapping[parsedCommand.device];
    const action = parsedCommand.action === 'on';

    if (device) {
      setDevices(prev => ({
        ...prev,
        [device]: action
      }));
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { text: input, isBot: false }]);
    setInput('');
    setIsTyping(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: input }),
      });
      
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      
      // Add slight delay to simulate typing
      setTimeout(() => {
        setMessages(prev => [...prev, { text: data.response, isBot: true }]);
        setIsTyping(false);
        
        if (data.parsedCommand && data.isDeviceCommand) {
          handleDeviceCommand(data.parsedCommand);
        }
      }, 500);

    } catch (error) {
      console.error("Error in handleSend:", error);
      setMessages(prev => [...prev, { 
        text: "Sorry, I encountered an error. Please try again.", 
        isBot: true 
      }]);
      setIsTyping(false);
    }
  };

  const handleVoiceCommand = () => {
    if (!isRecording) {
      if ('webkitSpeechRecognition' in window) {
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsRecording(true);
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsRecording(false);
          setIsListening(false);
          // Automatically send the voice command
          handleSend();
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
          setIsListening(false);
        };

        recognition.start();
      } else {
        alert('Speech recognition is not supported in your browser.');
      }
    } else {
      setIsRecording(false);
      setIsListening(false);
    }
  };

  // Add typing indicator component
  const TypingIndicator = () => (
    <div className="flex space-x-2 p-3 bg-gray-100 rounded-lg">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsChatbotOpen(!isChatbotOpen)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 z-50"
      >
        {isChatbotOpen ? 'Close' : 'Chat'}
      </button>

      {isChatbotOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white rounded-lg shadow-lg flex flex-col z-40">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg">
            <h3 className="font-semibold">Smart Home AI Assistant</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.isBot
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <TypingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleVoiceCommand}
                className={`p-2 rounded-full ${
                  isRecording ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSend}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
              >
                <Send size={20} />
              </button>
            </div>
            {isListening && (
              <div className="text-sm text-gray-500 mt-2">
                Listening... Speak now
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <button
        onClick={() => setIsChatbotOpen(!isChatbotOpen)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 z-50"
      >
        {isChatbotOpen ? 'Close' : 'Chat'}
      </button>

      {isChatbotOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white rounded-lg shadow-lg flex flex-col z-40">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg">
            <h3 className="font-semibold">Smart Home Assistant</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.isBot
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleVoiceCommand}
                className={`p-2 rounded-full ${
                  isRecording ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSend}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
              >
                <Send size={20} />
              </button>
            </div>
            {isListening && (
              <div className="text-sm text-gray-500 mt-2">
                Listening... Speak now
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Room Diagram Component
const RoomDiagram = ({ devices }) => {
  const DeviceIcon = ({ name, Icon, x, y, isOn }) => (
    <div
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
        isOn ? 'scale-110' : 'scale-100'
      }`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="relative">
        <Icon
          size={32}
          className={`transition-colors duration-300 ${
            isOn ? 'text-yellow-400' : 'text-gray-400'
          }`}
        />
        {isOn && (
          <div className="absolute -inset-3 bg-yellow-200 rounded-full opacity-25 animate-pulse" />
        )}
      </div>
      <span className="text-sm font-medium text-gray-600 mt-2 block text-center">{name}</span>
    </div>
  );

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Room Diagram</h2>
      
      <div className="grid grid-cols-2 gap-8">
        {/* Living Room */}
        <div className="relative bg-gray-100 rounded-lg p-4 aspect-square">
          <h3 className="text-lg font-semibold mb-2">Living Room</h3>
          <div className="relative h-full border-2 border-gray-300 rounded-lg">
            <DeviceIcon
              name="TV"
              Icon={Tv}
              x={50}
              y={20}
              isOn={devices?.TV || false}
            />
            <DeviceIcon
              name="Smart Lights"
              Icon={Lightbulb}
              x={20}
              y={50}
              isOn={devices?.['Smart Lights'] || false}
            />
            <DeviceIcon
              name="Air Conditioner"
              Icon={Waves}
              x={80}
              y={50}
              isOn={devices?.['Air Conditioner'] || false}
            />
            <DeviceIcon
              name="Smart Curtains"
              Icon={Blinds}
              x={50}
              y={80}
              isOn={devices?.['Smart Curtains'] || false}
            />
          </div>
        </div>

        {/* Bedroom */}
        <div className="relative bg-gray-100 rounded-lg p-4 aspect-square">
          <h3 className="text-lg font-semibold mb-2">Bedroom</h3>
          <div className="relative h-full border-2 border-gray-300 rounded-lg">
            <DeviceIcon
              name="Smart Lights"
              Icon={Lightbulb}
              x={50}
              y={20}
              isOn={devices?.['Smart Lights'] || false}
            />
            <DeviceIcon
              name="Air Purifier"
              Icon={Fan}
              x={20}
              y={50}
              isOn={devices?.['Air Purifier'] || false}
            />
            <DeviceIcon
              name="Smart Curtains"
              Icon={Blinds}
              x={80}
              y={50}
              isOn={devices?.['Smart Curtains'] || false}
            />
            <DeviceIcon
              name="Air Conditioner"
              Icon={Waves}
              x={50}
              y={80}
              isOn={devices?.['Air Conditioner'] || false}
            />
          </div>
        </div>

        {/* Kitchen */}
        <div className="relative bg-gray-100 rounded-lg p-4 aspect-square">
          <h3 className="text-lg font-semibold mb-2">Kitchen</h3>
          <div className="relative h-full border-2 border-gray-300 rounded-lg">
            <DeviceIcon
              name="Smart Lights"
              Icon={Lightbulb}
              x={50}
              y={20}
              isOn={devices?.['Smart Lights'] || false}
            />
            <DeviceIcon
              name="Coffee Maker"
              Icon={Coffee}
              x={20}
              y={50}
              isOn={devices?.['Coffee Maker'] || false}
            />
            <DeviceIcon
              name="Smart Oven"
              Icon={Microwave}
              x={80}
              y={50}
              isOn={devices?.['Smart Oven'] || false}
            />
            <DeviceIcon
              name="Refrigerator"
              Icon={Store}
              x={50}
              y={80}
              isOn={devices?.['Refrigerator'] || false}
            />
          </div>
        </div>

        {/* Garage */}
        <div className="relative bg-gray-100 rounded-lg p-4 aspect-square">
          <h3 className="text-lg font-semibold mb-2">Garage</h3>
          <div className="relative h-full border-2 border-gray-300 rounded-lg">
            <DeviceIcon
              name="Security Camera"
              Icon={Camera}
              x={50}
              y={20}
              isOn={devices?.['Security Camera'] || false}
            />
            <DeviceIcon
              name="Smart Lights"
              Icon={Lightbulb}
              x={20}
              y={50}
              isOn={devices?.['Smart Lights'] || false}
            />
            <DeviceIcon
              name="Garage Door"
              Icon={DoorClosed}
              x={80}
              y={50}
              isOn={devices?.['Garage Door'] || false}
            />
            <DeviceIcon
              name="EV Charger"
              Icon={Zap}
              x={50}
              y={80}
              isOn={devices?.['EV Charger'] || false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [showRoomDiagram, setShowRoomDiagram] = useState(false);
  const [activeRoom, setActiveRoom] = useState('livingRoom');
  const [devices, setDevices] = useState({
    TV: false,
    'Smart Lights': false,
    'Air Conditioner': false,
    'Air Purifier': false,
    'Smart Curtains': false,
    'Smart Oven': false,
    'Coffee Maker': false,
    'Smart Bed': false,
    Refrigerator: false,
    'Garage Door': false,
    'Security Camera': true,
    'EV Charger': false,
  });

  const energyData = [
    { name: 'Mon', value: 4000 },
    { name: 'Tue', value: 3000 },
    { name: 'Wed', value: 2000 },
    { name: 'Thu', value: 2780 },
    { name: 'Fri', value: 1890 },
    { name: 'Sat', value: 2390 },
    { name: 'Sun', value: 3490 },
  ];

  const rooms = [
    { id: 'livingRoom', name: 'Living Room', icon: Tv },
    { id: 'bedroom', name: 'Bedroom', icon: Bed },
    { id: 'kitchen', name: 'Kitchen', icon: Coffee },
    { id: 'garage', name: 'Garage', icon: Car },
  ];

  const roomDevices = {
    livingRoom: ['TV', 'Smart Lights', 'Air Conditioner', 'Smart Curtains'],
    bedroom: ['Smart Lights', 'Air Purifier', 'Smart Curtains', 'Air Conditioner'],
    kitchen: ['Smart Oven', 'Smart Lights', 'Coffee Maker', 'Refrigerator'],
    garage: ['Smart Lights', 'Garage Door', 'Security Camera', 'EV Charger'],
  };

  const toggleDevice = (device) => {
    setDevices((prev) => ({ ...prev, [device]: !prev[device] }));
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Side Navigation */}
      <nav className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800">Smart Home</h2>
        </div>
        <ul>
          {rooms.map((room) => (
            <li key={room.id}>
              <button
                onClick={() => {
                  setActiveRoom(room.id);
                  setShowRoomDiagram(false);
                }}
                className={`w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
                  activeRoom === room.id && !showRoomDiagram ? 'bg-blue-100 text-blue-600' : ''
                }`}
              >
                <room.icon className="mr-3" size={20} />
                {room.name}
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={() => setShowRoomDiagram(true)}
              className={`w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
                showRoomDiagram ? 'bg-blue-100 text-blue-600' : ''
              }`}
            >
              <Home className="mr-3" size={20} />
              Room Diagram
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {!showRoomDiagram ? (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Welcome Home, User</h1>
              <p className="text-gray-600">
                Manage your {rooms.find((r) => r.id === activeRoom).name} devices and monitor energy usage
              </p>
            </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard title={`${rooms.find((r) => r.id === activeRoom).name} Devices`}>
          <div className="space-y-4">
            {roomDevices[activeRoom].map((device) => (
              <ToggleSwitch
                key={device}
                label={device}
                isOn={devices[device]}
                onToggle={() => toggleDevice(device)}
              />
            ))}
          </div>
        </DashboardCard>
        
        <DashboardCard title="Temperature">
          <div className="flex items-center justify-center">
            <Thermometer size={48} className="text-red-500 mr-4" />
            <span className="text-4xl font-bold">22°C</span>
          </div>
        </DashboardCard>
        
        <DashboardCard title="Humidity">
          <div className="flex items-center justify-center">
            <Droplets size={48} className="text-blue-500 mr-4" />
            <span className="text-4xl font-bold">45%</span>
          </div>
        </DashboardCard>
        
        <DashboardCard title="Energy Usage">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </DashboardCard>
        
        {activeRoom === 'garage' && (
          <DashboardCard title="Security Camera">
            <div className="relative pt-[56.25%]">
              <img
                src="/api/placeholder/400/225"
                alt="Security Camera Feed"
                className="absolute top-0 left-0 w-full h-full object-cover rounded"
              />
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">LIVE</div>
            </div>
          </DashboardCard>
        )}
        
        {activeRoom === 'livingRoom' && (
          <DashboardCard title="Current Song">
            <div className="flex items-center">
              <img src="/api/placeholder/60/60" alt="Album Cover" className="w-16 h-16 rounded mr-4" />
              <div>
                <h4 className="font-semibold">Song Title</h4>
                <p className="text-sm text-gray-600">Artist Name</p>
              </div>
            </div>
            <div className="flex justify-center mt-4">
              <button className="mx-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="mx-2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button className="mx-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </DashboardCard>
        )}
      </div>
    </>
  ) : (
    <RoomDiagram devices={devices} />
  )}
</div>

<div className="relative">
        <Chatbot devices={devices} setDevices={setDevices} />
      </div>
    </div>
  );
};

export default Dashboard;
          