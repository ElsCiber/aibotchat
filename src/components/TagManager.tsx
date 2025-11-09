import { useState, useEffect } from "react";
import { Tag, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface TagType {
  id: string;
  name: string;
  color: string;
}

interface TagManagerProps {
  conversationId: string;
}

export function TagManager({ conversationId }: TagManagerProps) {
  const [tags, setTags] = useState<TagType[]>([]);
  const [conversationTags, setConversationTags] = useState<TagType[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  useEffect(() => {
    loadTags();
    loadConversationTags();
  }, [conversationId]);

  const loadTags = async () => {
    const { data, error } = await supabase.from("tags").select("*");
    if (!error && data) {
      setTags(data);
    }
  };

  const loadConversationTags = async () => {
    const { data, error } = await supabase
      .from("conversation_tags")
      .select("tag_id, tags(id, name, color)")
      .eq("conversation_id", conversationId);

    if (!error && data) {
      setConversationTags(data.map((ct: any) => ct.tags));
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: language === "es" ? "Usuario no autenticado" : "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("tags").insert([{
      name: newTagName,
      color: newTagColor,
      user_id: user.id,
    }]);

    if (error) {
      toast({
        title: "Error",
        description: language === "es" ? "Error al crear etiqueta" : "Error creating tag",
        variant: "destructive",
      });
      return;
    }

    setNewTagName("");
    setNewTagColor("#6366f1");
    setShowCreateDialog(false);
    loadTags();
    toast({
      title: language === "es" ? "Etiqueta creada" : "Tag created",
    });
  };

  const addTagToConversation = async (tagId: string) => {
    const { error } = await supabase.from("conversation_tags").insert({
      conversation_id: conversationId,
      tag_id: tagId,
    });

    if (error) {
      toast({
        title: "Error",
        description: language === "es" ? "Error al añadir etiqueta" : "Error adding tag",
        variant: "destructive",
      });
      return;
    }

    loadConversationTags();
  };

  const removeTagFromConversation = async (tagId: string) => {
    const { error } = await supabase
      .from("conversation_tags")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("tag_id", tagId);

    if (error) {
      toast({
        title: "Error",
        description: language === "es" ? "Error al quitar etiqueta" : "Error removing tag",
        variant: "destructive",
      });
      return;
    }

    loadConversationTags();
  };

  const availableTags = tags.filter(
    (tag) => !conversationTags.some((ct) => ct.id === tag.id)
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {conversationTags.map((tag) => (
        <Badge
          key={tag.id}
          style={{ backgroundColor: tag.color }}
          className="text-white gap-1"
        >
          {tag.name}
          <button
            onClick={() => removeTagFromConversation(tag.id)}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-6">
            <Tag className="h-3 w-3 mr-1" />
            {language === "es" ? "Etiqueta" : "Tag"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {language === "es" ? "Añadir etiqueta" : "Add tag"}
            </p>
            {availableTags.map((tag) => (
              <Button
                key={tag.id}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addTagToConversation(tag.id)}
              >
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </Button>
            ))}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  {language === "es" ? "Nueva etiqueta" : "New tag"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {language === "es" ? "Crear etiqueta" : "Create tag"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder={language === "es" ? "Nombre" : "Name"}
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground">
                      {language === "es" ? "Color" : "Color"}
                    </span>
                  </div>
                  <Button onClick={createTag} className="w-full">
                    {language === "es" ? "Crear" : "Create"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
