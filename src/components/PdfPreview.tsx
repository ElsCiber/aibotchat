import { useState } from "react";
import { X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface PdfPreviewProps {
  file: { name: string; content: string; type: string };
  onRemove: () => void;
}

export function PdfPreview({ file, onRemove }: PdfPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const { language } = useLanguage();

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  return (
    <>
      <div className="relative flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border">
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm truncate max-w-[120px]">{file.name}</span>
          {isPdf && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPreview(true)}
              className="h-6 px-2"
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
        </div>
        <button
          onClick={onRemove}
          className="text-destructive hover:text-destructive/90"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{file.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {isPdf ? (
              <iframe
                src={file.content}
                className="w-full h-[70vh] border-0"
                title={file.name}
              />
            ) : (
              <div className="p-4 bg-muted rounded-lg">
                <pre className="whitespace-pre-wrap text-sm">{file.content}</pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
