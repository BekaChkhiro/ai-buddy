/**
 * ChatInterface Component
 * Main chat interface bringing together all chat components
 */

"use client";

import { useState, useEffect } from "react";
import { useChat, ChatMode } from "@/hooks/useChat";
import { useTaskExtraction } from "@/hooks/useTaskExtraction";
import { ChatSidebar } from "./ChatSidebar";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { QuickActions } from "./QuickActions";
import { TaskSuggestions } from "@/components/tasks/TaskSuggestions";
import { TaskReview } from "@/components/tasks/TaskReview";
import { BulkTaskCreate } from "@/components/tasks/BulkTaskCreate";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExtractedTask } from "@/lib/claude/task-extraction";
import { Task } from "@/types";

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

  // Task extraction state
  const [showTaskSuggestions, setShowTaskSuggestions] = useState(false);
  const [showTaskReview, setShowTaskReview] = useState(false);
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  const [tasksToReview, setTasksToReview] = useState<ExtractedTask[]>([]);
  const [tasksToCreate, setTasksToCreate] = useState<ExtractedTask[]>([]);
  const [showAutoSuggestion, setShowAutoSuggestion] = useState(false);

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

  const {
    isExtracting,
    extractionResult,
    error: extractionError,
    extractFromConversation,
    shouldSuggestExtraction,
    clearResult,
  } = useTaskExtraction();

  // Auto-detect task content and suggest extraction
  useEffect(() => {
    if (messages.length >= 3 && !isStreaming && !showTaskSuggestions) {
      const formattedMessages = messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      const shouldSuggest = shouldSuggestExtraction(formattedMessages);
      setShowAutoSuggestion(shouldSuggest);
    }
  }, [messages, isStreaming, showTaskSuggestions, shouldSuggestExtraction]);

  // Show task suggestions when extraction completes
  useEffect(() => {
    if (extractionResult && extractionResult.tasks.length > 0) {
      setShowTaskSuggestions(true);
    }
  }, [extractionResult]);

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

  // Handle manual task extraction
  const handleExtractTasks = async () => {
    if (!conversation?.id) return;

    setShowAutoSuggestion(false);
    await extractFromConversation(conversation.id, {
      maxTasks: 10,
      minConfidence: 60,
      detectDependencies: true,
      includeTimeEstimates: true,
    });
  };

  // Handle task review
  const handleReviewTasks = (tasks: ExtractedTask[]) => {
    setTasksToReview(tasks);
    setShowTaskSuggestions(false);
    setShowTaskReview(true);
  };

  // Handle approve tasks
  const handleApproveTasks = (tasks: ExtractedTask[]) => {
    setTasksToCreate(tasks);
    setShowTaskReview(false);
    setShowBulkCreate(true);
  };

  // Handle reject tasks
  const handleRejectTasks = () => {
    setShowTaskReview(false);
    setTasksToReview([]);
  };

  // Handle dismiss suggestions
  const handleDismissSuggestions = () => {
    setShowTaskSuggestions(false);
    setShowAutoSuggestion(false);
    clearResult();
  };

  // Handle bulk create complete
  const handleBulkCreateComplete = (createdTasks: Task[]) => {
    console.log("Created tasks:", createdTasks);
    setShowBulkCreate(false);
    setTasksToCreate([]);
    setTasksToReview([]);
    clearResult();

    // Could show a success toast here
  };

  // Handle bulk create error
  const handleBulkCreateError = (error: string) => {
    console.error("Bulk create error:", error);
    // Could show an error toast here
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

          <div className="flex items-center gap-2">
            {/* Auto-suggest extraction button */}
            {showAutoSuggestion && !showTaskSuggestions && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExtractTasks}
                disabled={isExtracting || !conversation?.id}
                className="border-purple-500/30 hover:bg-purple-500/10"
              >
                <Sparkles className="h-4 w-4 mr-1 text-purple-500" />
                Extract Tasks
              </Button>
            )}

            {/* Manual extraction button */}
            {messages.length > 0 && !showAutoSuggestion && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExtractTasks}
                disabled={isExtracting || !conversation?.id}
              >
                <ListTodo className="h-4 w-4 mr-1" />
                Extract Tasks
              </Button>
            )}

            {/* Error display */}
            {error && <div className="text-sm text-destructive">{error}</div>}
            {extractionError && (
              <div className="text-sm text-destructive">
                Task extraction failed: {extractionError}
              </div>
            )}
          </div>
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
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-hidden">
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
              </div>

              {/* Task Suggestions */}
              {(showTaskSuggestions || isExtracting) && (
                <div className="p-4 border-t bg-gray-50/50 dark:bg-gray-900/50">
                  <TaskSuggestions
                    tasks={extractionResult?.tasks || []}
                    summary={extractionResult?.summary}
                    totalEstimatedHours={extractionResult?.totalEstimatedHours}
                    loading={isExtracting}
                    onReview={handleReviewTasks}
                    onDismiss={handleDismissSuggestions}
                  />
                </div>
              )}
            </div>
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

      {/* Task Review Dialog */}
      <TaskReview
        tasks={tasksToReview}
        isOpen={showTaskReview}
        onClose={() => setShowTaskReview(false)}
        onApprove={handleApproveTasks}
        onReject={handleRejectTasks}
      />

      {/* Bulk Task Create Dialog */}
      <BulkTaskCreate
        tasks={tasksToCreate}
        projectId={projectId}
        conversationId={conversation?.id}
        isOpen={showBulkCreate}
        onClose={() => setShowBulkCreate(false)}
        onComplete={handleBulkCreateComplete}
        onError={handleBulkCreateError}
      />
    </div>
  );
}
