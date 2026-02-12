import React from 'react';
import { ChatMode } from '../types';

interface ChatModeSelectorProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled: boolean;
}

const ChatModeSelector: React.FC<ChatModeSelectorProps> = ({ currentMode, onModeChange, disabled }) => {
  return (
    <div className="mb-4">
      <label htmlFor="chatMode" className="block text-sm font-medium text-gray-700 mb-1">
        Select Chat Mode:
      </label>
      <select
        id="chatMode"
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        value={currentMode}
        onChange={(e) => onModeChange(e.target.value as ChatMode)}
        disabled={disabled}
      >
        {Object.values(ChatMode).map((mode) => (
          <option key={mode} value={mode}>
            {mode}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ChatModeSelector;