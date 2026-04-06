'use client';

import { useState, useRef, useCallback, type KeyboardEvent, type DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (message: string, files?: FileList) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, disabled, placeholder }: MessageInputProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed && files.length === 0) return;

    if (files.length > 0) {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      onSend(trimmed, dt.files);
    } else {
      onSend(trimmed);
    }

    setInput('');
    setFiles([]);
  }, [input, files, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={cn(
        'border rounded-2xl bg-background transition-colors',
        isDragOver && 'border-primary bg-primary/5',
        'focus-within:border-primary/50'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          {files.map((file, i) => (
            <Badge
              key={`${file.name}-${i}`}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <span className="text-xs truncate max-w-[150px]">{file.name}</span>
              <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
              <button
                onClick={() => removeFile(i)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 text-xs"
              >
                ✕
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 p-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.heic,.heif,.txt,.md,.csv,.json,.py,.js,.ts,.tsx"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          📎
        </Button>
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Type a message... (Enter to send, Shift+Enter for new line)'}
          disabled={disabled}
          className="min-h-[40px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
          rows={1}
        />
        <Button
          type="button"
          size="icon"
          className="shrink-0 h-9 w-9"
          onClick={handleSend}
          disabled={disabled || (!input.trim() && files.length === 0)}
        >
          ↑
        </Button>
      </div>
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/5 rounded-2xl border-2 border-dashed border-primary pointer-events-none">
          <p className="text-sm font-medium text-primary">Drop files here</p>
        </div>
      )}
    </div>
  );
}
