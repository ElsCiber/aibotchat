import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";

interface ExportButtonProps {
  conversationId: string | null;
}

export function ExportButton({ conversationId }: ExportButtonProps) {
  const { language } = useLanguage();
  const { toast } = useToast();

  const loadMessages = async () => {
    if (!conversationId) return null;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: language === "es" ? "Error al cargar mensajes" : "Error loading messages",
        variant: "destructive",
      });
      return null;
    }

    return data;
  };

  const exportToTXT = async () => {
    const messages = await loadMessages();
    if (!messages) return;

    let content = "";
    messages.forEach((msg) => {
      const role = msg.role === "user" ? (language === "es" ? "Usuario" : "User") : (language === "es" ? "Asistente" : "Assistant");
      const timestamp = new Date(msg.created_at).toLocaleString(language === "es" ? "es-ES" : "en-US");
      content += `[${timestamp}] ${role}:\n${msg.content}\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `conversation-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: language === "es" ? "Exportado" : "Exported",
      description: language === "es" ? "Conversación exportada a TXT" : "Conversation exported to TXT",
    });
  };

  const exportToPDF = async () => {
    const messages = await loadMessages();
    if (!messages) return;

    const doc = new jsPDF();
    let y = 20;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    doc.setFontSize(16);
    doc.text("DeepView Conversation", margin, y);
    y += 15;

    doc.setFontSize(10);
    messages.forEach((msg) => {
      const role = msg.role === "user" ? (language === "es" ? "Usuario" : "User") : (language === "es" ? "Asistente" : "Assistant");
      const timestamp = new Date(msg.created_at).toLocaleString(language === "es" ? "es-ES" : "en-US");
      
      // Role and timestamp
      doc.setFont(undefined, "bold");
      const header = `[${timestamp}] ${role}:`;
      doc.text(header, margin, y);
      y += lineHeight;
      
      // Message content
      doc.setFont(undefined, "normal");
      const lines = doc.splitTextToSize(msg.content, doc.internal.pageSize.width - 2 * margin);
      
      lines.forEach((line: string) => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });
      
      y += lineHeight; // Space between messages
      
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    });

    doc.save(`conversation-${Date.now()}.pdf`);

    toast({
      title: language === "es" ? "Exportado" : "Exported",
      description: language === "es" ? "Conversación exportada a PDF" : "Conversation exported to PDF",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={!conversationId}>
          <Download className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card">
        <DropdownMenuItem onClick={exportToTXT}>
          {language === "es" ? "Exportar como TXT" : "Export as TXT"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          {language === "es" ? "Exportar como PDF" : "Export as PDF"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
