import React, { useRef, useEffect } from 'react';
import { Message, ToolSource } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const renderSources = (sources: ToolSource[]) => (
    <div className="mt-2 text-xs text-gray-600 border-t pt-2">
      <p className="font-semibold mb-1">Sources:</p>
      <ul className="list-disc pl-5 space-y-1">
        {sources.map((source, index) => (
          <li key={index} className="break-words">
            <a
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
              title={source.title || source.uri}
            >
              {source.title || new URL(source.uri).hostname + (source.uri.length > 50 ? '...' : '')}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[75%] p-3 rounded-lg shadow-md ${
              message.sender === 'user'
                ? 'bg-blue-500 text-white rounded-br-none'
                : 'bg-gray-200 text-gray-800 rounded-bl-none'
            }`}
          >
            {message.imageUrl && (
              <img
                src={message.imageUrl}
                alt="Uploaded content"
                className="max-h-48 max-w-full rounded-md mb-2 object-cover"
              />
            )}
            <p className="whitespace-pre-wrap">{message.text}</p>
            {message.sources && message.sources.length > 0 && renderSources(message.sources)}
            <span className={`block text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
      {isLoading && <LoadingSpinner />}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;