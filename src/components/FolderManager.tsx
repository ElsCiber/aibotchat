import { useState, useEffect } from "react";
import { Plus, Folder, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FolderType {
  id: string;
  name: string;
  color: string;
}

interface FolderManagerProps {
  conversationId: string | null;
  onFolderChange?: () => void;
}

const COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Red", value: "#ef4444" },
  { name: "Purple", value: "#a855f7" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
];

export function FolderManager({ conversationId, onFolderChange }: FolderManagerProps) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const { toast } = useToast();
  const { language } = useLanguage();

  useEffect(() => {
    loadFolders();
    if (conversationId) {
      loadCurrentFolder();
    }
  }, [conversationId]);

  const loadFolders = async () => {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading folders:", error);
      return;
    }

    setFolders(data || []);
  };

  const loadCurrentFolder = async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from("conversations")
      .select("folder_id")
      .eq("id", conversationId)
      .single();

    if (error) {
      console.error("Error loading current folder:", error);
      return;
    }

    setCurrentFolder(data?.folder_id || null);
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("folders")
      .insert({
        name: newFolderName.trim(),
        color: selectedColor,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: language === "es" ? "Error al crear carpeta" : "Error creating folder",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: language === "es" ? "Carpeta creada" : "Folder created",
    });

    setNewFolderName("");
    setIsCreating(false);
    loadFolders();
  };

  const deleteFolder = async (folderId: string) => {
    const { error } = await supabase
      .from("folders")
      .delete()
      .eq("id", folderId);

    if (error) {
      toast({
        title: "Error",
        description: language === "es" ? "Error al eliminar carpeta" : "Error deleting folder",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: language === "es" ? "Carpeta eliminada" : "Folder deleted",
    });

    loadFolders();
    if (onFolderChange) onFolderChange();
  };

  const assignFolder = async (folderId: string | null) => {
    if (!conversationId) return;

    const { error } = await supabase
      .from("conversations")
      .update({ folder_id: folderId })
      .eq("id", conversationId);

    if (error) {
      toast({
        title: "Error",
        description: language === "es" ? "Error al asignar carpeta" : "Error assigning folder",
        variant: "destructive",
      });
      return;
    }

    setCurrentFolder(folderId);
    toast({
      title: language === "es" ? "Carpeta asignada" : "Folder assigned",
    });
    if (onFolderChange) onFolderChange();
  };

  const currentFolderData = folders.find(f => f.id === currentFolder);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Folder className="h-4 w-4" style={{ color: currentFolderData?.color }} />
            {currentFolderData?.name || (language === "es" ? "Sin carpeta" : "No folder")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-card">
          <DropdownMenuItem
            onClick={() => assignFolder(null)}
            className={!currentFolder ? "bg-muted" : ""}
          >
            {language === "es" ? "Sin carpeta" : "No folder"}
          </DropdownMenuItem>
          {folders.map((folder) => (
            <DropdownMenuItem
              key={folder.id}
              onClick={() => assignFolder(folder.id)}
              className={currentFolder === folder.id ? "bg-muted" : ""}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" style={{ color: folder.color }} />
                  {folder.name}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFolder(folder.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              setIsCreating(true);
            }}
            className="border-t border-border mt-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            {language === "es" ? "Nueva carpeta" : "New folder"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isCreating && (
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-2">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder={language === "es" ? "Nombre de carpeta" : "Folder name"}
            className="h-8"
            autoFocus
          />
          <select
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="h-8 px-2 rounded border border-border bg-background"
          >
            {COLORS.map((color) => (
              <option key={color.value} value={color.value}>
                {color.name}
              </option>
            ))}
          </select>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={createFolder}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsCreating(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
