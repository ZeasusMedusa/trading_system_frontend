import { useState, useRef } from 'react';

interface UseFileUploadProps {
  onFileLoad: (content: string, fileName: string) => void;
  onStrategyNameUpdate?: (name: string) => void;
}

export function useFileUpload({ onFileLoad, onStrategyNameUpdate }: UseFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const loadJsonFile = async (file: File) => {
    const text = await file.text();
    try {
      // Validate JSON
      const parsed = JSON.parse(text);
      const formattedContent = JSON.stringify(parsed, null, 2);
      onFileLoad(formattedContent, file.name);

      // Auto-fill strategy name if available
      if (parsed.name && onStrategyNameUpdate) {
        onStrategyNameUpdate(parsed.name);
      }

      return { success: true, parsed };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.name.endsWith('.json'));

    if (jsonFile) {
      return await loadJsonFile(jsonFile);
    } else {
      return { success: false, error: new Error('Please drop a .json file') };
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.json')) {
      return await loadJsonFile(file);
    } else if (file) {
      return { success: false, error: new Error('Please select a .json file') };
    }
    return { success: false, error: new Error('No file selected') };
  };

  return {
    isDragging,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleFileChange,
  };
}
