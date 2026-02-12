import React, { useState, useRef } from 'react';
import FilePreview from './FilePreview';
import ChatModeSelector from './ChatModeSelector';
import { ChatMode } from '../types';

interface MessageInputProps {
  onSendMessage: (text: string, file?: File) => void;
  isLoading: boolean;
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  isMultimodalMode: boolean; // Indicates if the current mode supports file uploads
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
  currentMode,
  onModeChange,
  isMultimodalMode,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setFilePreviewUrl(null);
      if (file) {
        alert('Please upload an image file (PNG, JPG, JPEG, GIF, WEBP).');
      }
    }
  };

  const clearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (inputText.trim() || selectedFile) {
      onSendMessage(inputText.trim(), selectedFile || undefined);
      setInputText('');
      clearFile();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-4 border-t border-gray-200">
      <ChatModeSelector
        currentMode={currentMode}
        onModeChange={onModeChange}
        disabled={isLoading}
      />

      {filePreviewUrl && <FilePreview fileUrl={filePreviewUrl} onClear={clearFile} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <textarea
            className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            rows={inputText.split('\n').length > 1 ? Math.min(5, inputText.split('\n').length) : 1}
            value={inputText}
            onChange={handleTextChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            aria-label="Chat message input"
          />
          {isMultimodalMode && (
            <label
              htmlFor="file-upload"
              className={`cursor-pointer p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex-shrink-0
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              <input
                id="file-upload"
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          )}

          <button
            type="submit"
            className={`p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex-shrink-0 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading || (!inputText.trim() && !selectedFile)}
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;