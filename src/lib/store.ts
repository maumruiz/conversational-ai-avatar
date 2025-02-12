import { create } from "zustand";

interface MessageResultType {
  visemes: [number, number][];
  audioPlayer: HTMLAudioElement;
}

interface MessageType {
  role: string;
  content: string;
  id: string;
}

interface ConversationState {
  messageResult: MessageResultType | null;
  messages: MessageType[];
  thinking: boolean;
  setMessageResult: (message: MessageResultType | null) => void;
  addMessage: (message: MessageType) => void;
  setThinking: (thinking: boolean) => void;
}

export const useConversation = create<ConversationState>()((set) => ({
  messageResult: null,
  messages: [],
  thinking: false,
  setMessageResult: (messageResult) => set({ messageResult }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setThinking: (thinking) => set({ thinking }),
}));
