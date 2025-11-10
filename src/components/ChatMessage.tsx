import { Message } from "@/utils/chatStream";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy, Check, Download, ImagePlus } from "lucide-react";
import { useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./CodeBlock";

interface ChatMessageProps {
  message: Message;
  language?: string;
  onAttachImage?: (imageUrl: string) => void;
}

const ChatMessage = ({ message, language = "en", onAttachImage }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const [isCopied, setIsCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      toast({
        title: language === "es" ? "Copiado" : "Copied",
        description: language === "es" ? "Respuesta copiada al portapapeles" : "Response copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: language === "es" ? "No se pudo copiar" : "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const handleDownloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `deepview-image-${Date.now()}-${index}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: language === "es" ? "Descargado" : "Downloaded",
        description: language === "es" ? "Imagen descargada correctamente" : "Image downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: language === "es" ? "No se pudo descargar la imagen" : "Failed to download image",
        variant: "destructive",
      });
    }
  };

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
        <div className="text-base leading-relaxed prose prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                const codeContent = String(children).replace(/\n$/, "");
                
                return !inline && match ? (
                  <CodeBlock language={match[1]}>
                    {codeContent}
                  </CodeBlock>
                ) : (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                );
              },
              p: ({ children }) => <p className="mb-2">{children}</p>,
              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        
        {/* User uploaded images - no download button */}
        {isUser && message.images && message.images.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {message.images.map((img, idx) => (
              <Dialog key={idx}>
                <DialogTrigger asChild>
                  <img
                    src={img}
                    alt={`Uploaded image ${idx + 1}`}
                    className="max-w-full rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ maxHeight: "400px" }}
                  />
                </DialogTrigger>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
                  <img
                    src={img}
                    alt={`Uploaded image ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
        
        {/* AI generated images - with download button and zoom */}
        {!isUser && message.images && message.images.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {message.images.map((img, idx) => (
              <div key={idx} className="relative inline-block group">
                <Dialog>
                  <DialogTrigger asChild>
                    <img
                      src={img}
                      alt={`Generated image ${idx + 1}`}
                      className="max-w-full rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ maxHeight: "400px" }}
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
                    <img
                      src={img}
                      alt={`Generated image ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </DialogContent>
                </Dialog>
                <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownloadImage(img, idx)}
                    className="shadow-lg"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {language === "es" ? "Descargar" : "Download"}
                  </Button>
                  {onAttachImage && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onAttachImage(img)}
                      className="shadow-lg"
                    >
                      <ImagePlus className="h-4 w-4 mr-1" />
                      {language === "es" ? "Adjuntar" : "Attach"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {!isUser && (
          <div className="flex gap-1 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-2"
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ChatMessage);
