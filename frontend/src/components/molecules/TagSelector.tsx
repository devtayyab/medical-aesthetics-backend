import React, { useState } from "react";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";

interface TagSelectorProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  tags,
  onAddTag,
  onRemoveTag,
}) => {
  const [newTag, setNewTag] = useState("");

  const handleAdd = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onAddTag(newTag.trim());
      setNewTag("");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          placeholder="Add tag"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
        />
        <Button onClick={handleAdd}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm flex items-center"
          >
            {tag}
            <button
              className="ml-2 text-red-600"
              onClick={() => onRemoveTag(tag)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};
