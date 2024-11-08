// src/components/Dashboard.js
import React, { useState } from 'react';
import ChatBot from './ChatBot';
import VoiceRecognition from './VoiceRecognition';
import ToggleSwitch from './ToggleSwitch';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tv, Bed, Coffee, Car, Thermometer, Droplets } from 'lucide-react';

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
  livingRoom: ['TV', 'Smart Lights', 'Air Conditioner','Smart Curtains'],
  bedroom: ['Smart Lights', 'Air Purifier', 'Smart Curtains','Air Conditioner'],
  kitchen: ['Smart Oven','Smart Lights', 'Coffee Maker', 'Refrigerator'],
  garage: ['Smart Lights','Garage Door', 'Security Camera', 'EV Charger'],
};

const Dashboard = () => {
  const [activeRoom, setActiveRoom] = useState('livingRoom');
  const [devices, setDevices] = useState({
    TV: false,
    'Smart Lights': false,
    'Air Conditioner': false,
    'Air Purifier': false,
    'Smart Curtains': false,
    'Smart Oven': false,
    'Coffee Maker': false,
    Refrigerator: false,
    'Garage Door': false,
    'Security Camera': true,
    'EV Charger': false,
  });

  const toggleDevice = (device) => {
    setDevices(prev => ({ ...prev, [device]: !prev[device] }));
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <nav className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800">Smart Home</h2>
        </div>
        <ul>
          {rooms.map((room) => (
            <li key={room.id}>
              <button
                onClick={() => setActiveRoom(room.id)}
                className={`w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${activeRoom === room.id ? 'bg-blue-100 text-blue-600' : ''}`}
              >
                <room.icon className="mr-3" size={20} />
                {room.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Home, User</h1>
          <p className="text-gray-600">Manage your {rooms.find(r => r.id === activeRoom).name} devices and monitor energy usage</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">{rooms.find(r => r.id === activeRoom).name} Devices</h3>
            <div className="space-y-4">
              {roomDevices[activeRoom].map(device => (
                <ToggleSwitch 
                  key={device}
                  label={device} 
                  isOn={devices[device]} 
                  onToggle={() => toggleDevice(device)} 
                />
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Temperature</h3>
            <div className="flex items-center justify-center">
              <Thermometer size={48} className="text-red-500 mr-4" />
              <span className="text-4xl font-bold">22°C</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Humidity</h3>
            <div className="flex items-center justify-center">
              <Droplets size={48} className="text-blue-500 mr-4" />
              <span className="text-4xl font-bold">45%</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Energy Usage</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={energyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-10">
          <ChatBot />
          <VoiceRecognition />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
