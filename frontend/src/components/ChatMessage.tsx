import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = role === "user";

  return (
    <div
      className={cn(
        "group flex w-full gap-3 px-4 py-6",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Role label - removed */}
        {/* <span className="text-xs font-semibold text-muted-foreground">
          {isUser ? "You" : "Assistant"}
        </span> */}

        {/* Message content */}
        <div
          className={cn(
            "rounded-3xl  py-3 text-sm leading-relaxed transition-all",
            isUser
              ? "bg-muted text-foreground hover:bg-accent px-4"
              : "text-foreground"
          )}
        >
          <div className="whitespace-pre-wrap break-words">{content}</div>
        </div>

        {/* Footer with timestamp and copy button */}
        <div className="flex items-center gap-2">
          {/* Timestamp - commented out */}
          {/* {timestamp && (
            <span className="text-xs text-muted-foreground">
              {timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )} */}

          {/* Copy button - only for assistant messages */}
          {!isUser && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 transition-all cursor-pointer"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{copied ? "Copied!" : "Copy message"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
}
