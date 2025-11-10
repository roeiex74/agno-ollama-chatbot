import { useState, type KeyboardEvent, useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onCancelStream?: () => void;
  isStreaming?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  onCancelStream,
  isStreaming = false,
  placeholder = "Message...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";
    // Set height based on scrollHeight (up to max-height set in CSS)
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [message]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isStreaming) {
      onSendMessage(trimmedMessage);
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleButtonClick = () => {
    if (isStreaming && onCancelStream) {
      onCancelStream();
    } else {
      handleSend();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (if not streaming), new line on Shift+Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming) {
        handleSend();
      }
    }
  };

  return (
    <div className="bg-background p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-3">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={false}
            rows={1}
            className={cn(
              "min-h-[56px] max-h-[200px] resize-none",
              "rounded-3xl border-2 bg-muted/50 px-5 py-4",
              "focus:border-primary focus:bg-background",
              "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
            )}
          />
          <Button
            onClick={handleButtonClick}
            disabled={!isStreaming && !message.trim()}
            size="icon"
            className={cn(
              "absolute bottom-3 right-4 h-8 w-8 shrink-0 rounded-full cursor-pointer hover:opacity-90 transition-all"
              // isStreaming && "bg-destructive hover:bg-destructive"
            )}
          >
            {isStreaming ? (
              <Square className="h-4 w-4 fill-current" />
            ) : (
              <Send className="w-4 mr-[1px]" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
