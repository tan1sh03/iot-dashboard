// src/components/ToggleSwitch.js
import React from 'react';

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

export default ToggleSwitch;
