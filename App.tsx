import React, { useState, useCallback, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import { geminiService } from './services/geminiService';
import { ChatMode, Message, ToolSource } from './types';

// Helper to convert File to base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to read file as string."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>(ChatMode.Standard);
  const [isApiKeyPrompted, setIsApiKeyPrompted] = useState<boolean>(false);

  // Check API key status on mount
  useEffect(() => {
    const checkApiKey = async () => {
      // Assume window.aistudio is available in the environment
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey && !isApiKeyPrompted) {
          // If no key selected and not yet prompted, open selection dialog
          setIsApiKeyPrompted(true);
          await window.aistudio.openSelectKey();
          // After calling openSelectKey, assume success and proceed.
          // The actual API call will use the (hopefully) updated process.env.API_KEY
        }
      }
    };
    checkApiKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleSendMessage = useCallback(async (text: string, file?: File) => {
    setIsLoading(true);
    let userMessage: Message;
    let fileData: { data: string; mimeType: string } | undefined;
    let filePreviewUrl: string | undefined;

    if (file) {
      try {
        fileData = {
          data: await fileToBase64(file),
          mimeType: file.type,
        };
        filePreviewUrl = URL.createObjectURL(file);
      } catch (error) {
        console.error("Error reading file:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: 'ai',
            text: 'Error processing file. Please try again.',
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }
    }

    userMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: text,
      imageUrl: filePreviewUrl,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      let aiResponseText: string;
      let aiSources: ToolSource[] | undefined;

      switch (currentMode) {
        case ChatMode.SearchGrounded:
          if (fileData) {
            // Search Grounded mode is text-only for now due to complexity of multimodal search grounding
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                sender: 'ai',
                text: "File uploads are not supported in Search Grounded mode. Please switch to Standard Chat for multimodal input.",
                timestamp: new Date(),
              },
            ]);
            setIsLoading(false);
            if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
            return;
          }
          const searchResult = await geminiService.generateContentSearchGrounded(text);
          aiResponseText = searchResult.text;
          aiSources = searchResult.sources;
          break;
        case ChatMode.FastResponse:
          if (fileData) {
            // Fast Response mode is text-only for now, direct multimodal processing is handled by Standard
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                sender: 'ai',
                text: "File uploads are not supported in Fast Response mode. Please switch to Standard Chat for multimodal input.",
                timestamp: new Date(),
              },
            ]);
            setIsLoading(false);
            if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
            return;
          }
          const fastResult = await geminiService.generateContentFast(text);
          aiResponseText = fastResult.text;
          aiSources = fastResult.sources;
          break;
        case ChatMode.Standard:
        default:
          const standardResult = await geminiService.generateContentStandard(text, fileData);
          aiResponseText = standardResult.text;
          aiSources = standardResult.sources;
          break;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'ai',
          text: aiResponseText,
          sources: aiSources,
          timestamp: new Date(),
        },
      ]);
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      let errorMessage = 'An error occurred while communicating with the AI.';
      if (error.message.includes("Requested entity was not found.")) {
        errorMessage = "API key issue: Requested entity was not found. Please ensure your API key is correct and associated with a paid GCP project. You can update it by clicking 'Select API Key' in the AI Studio menu.";
        // Potentially re-prompt user to select API key if this specific error occurs
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
          await window.aistudio.openSelectKey();
        }
      } else if (error.message) {
        errorMessage = `AI Error: ${error.message}`;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'ai',
          text: errorMessage,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl); // Clean up object URL
    }
  }, [currentMode, isApiKeyPrompted]); // Add isApiKeyPrompted to dependency array

  const isMultimodalMode = currentMode === ChatMode.Standard;

  return (
    <div className="flex flex-col h-full w-full">
      <h1 className="text-2xl font-bold text-gray-800 p-4 border-b border-gray-200">
        Intelligent AI Chatbot
      </h1>
      <ChatWindow messages={messages} isLoading={isLoading} />
      <MessageInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        isMultimodalMode={isMultimodalMode}
      />
    </div>
  );
};

export default App;