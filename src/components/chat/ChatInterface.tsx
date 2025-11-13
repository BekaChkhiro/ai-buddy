/**
 * ChatInterface Component
 * Main chat interface bringing together all chat components
 */

"use client";

import { useState } from "react";
import { useChat, ChatMode } from "@/hooks/useChat";
import { ChatSidebar } from "./ChatSidebar";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { QuickActions } from "./QuickActions";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  projectId: string;
  conversationId?: string;
  defaultMode?: ChatMode;
  showSidebar?: boolean;
  className?: string;
}

export function ChatInterface({
  projectId,
  conversationId,
  defaultMode = "general",
  showSidebar = true,
  className,
}: ChatInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(showSidebar);
  const [contextFiles, setContextFiles] = useState<string[]>([]);

  const {
    conversation,
    conversations,
    loadingConversations,
    messages,
    loadingMessages,
    isStreaming,
    streamingContent,
    error,
    sendMessage,
    stopStreaming,
    createConversation,
    switchConversation,
    deleteConversation,
    updateConversationMode,
    updateContextFiles,
    regenerateLastMessage,
    editMessage,
  } = useChat({
    projectId,
    conversationId,
    mode: defaultMode,
    contextFiles,
  });

  // Handle new conversation
  const handleNewConversation = async () => {
    await createConversation();
  };

  // Handle send message
  const handleSendMessage = async (message: string, files?: string[]) => {
    if (files) {
      setContextFiles(files);
      await updateContextFiles(files);
    }
    await sendMessage(message);
  };

  // Handle quick action
  const handleQuickAction = async (prompt: string, mode?: ChatMode) => {
    if (mode && mode !== conversation?.mode) {
      await updateConversationMode(mode);
    }
    await sendMessage(prompt);
  };

  // Handle mode change
  const handleModeChange = async (mode: ChatMode) => {
    await updateConversationMode(mode);
  };

  // Handle edit message
  const handleEditMessage = async (messageId: string, content: string) => {
    await editMessage(messageId, content);
  };

  // Handle delete message (not implemented in useChat yet, placeholder)
  const handleDeleteMessage = async (messageId: string) => {
    console.log("Delete message:", messageId);
    // TODO: Implement message deletion
  };

  return (
    <div className={cn("flex h-full bg-background", className)}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-80 flex-shrink-0">
          <ChatSidebar
            conversations={conversations}
            currentConversation={conversation}
            currentMode={conversation?.mode || defaultMode}
            loading={loadingConversations}
            onNewConversation={handleNewConversation}
            onSelectConversation={switchConversation}
            onDeleteConversation={deleteConversation}
            onModeChange={handleModeChange}
          />
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {showSidebar && (
              <Button size="icon" variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            )}
            <div>
              <h1 className="text-lg font-semibold">{conversation?.title || "New Conversation"}</h1>
              <p className="text-xs text-muted-foreground capitalize">
                {conversation?.mode || defaultMode} mode
              </p>
            </div>
          </div>

          {/* Error display */}
          {error && <div className="text-sm text-destructive">{error}</div>}
        </div>

        {/* Messages or empty state */}
        <div className="flex-1 overflow-hidden">
          {messages.length === 0 && !isStreaming ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <div className="max-w-2xl w-full px-4">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
                    <p className="text-muted-foreground">
                      Choose a quick action below or type your own message
                    </p>
                  </div>
                  <QuickActions
                    onSelectAction={handleQuickAction}
                    currentMode={conversation?.mode || defaultMode}
                  />
                </div>
              </div>
            </div>
          ) : (
            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              loading={loadingMessages}
              onStopStreaming={stopStreaming}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onRegenerateMessage={regenerateLastMessage}
            />
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSendMessage}
          disabled={isStreaming || loadingMessages}
          contextFiles={contextFiles}
          onContextFilesChange={setContextFiles}
        />
      </div>
    </div>
  );
}
