import { Message } from "@/utils/chatStream";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full mb-6", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-6 py-4 shadow-lg",
          isUser
            ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground"
            : "bg-card border border-border"
        )}
        style={isUser ? { boxShadow: "var(--shadow-glow)" } : {}}
      >
        <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
