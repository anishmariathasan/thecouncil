'use client';

import { useState, useRef, useCallback, type KeyboardEvent, type DragEvent } from 'react';
import { Paperclip, SendHorizontal, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (message: string, files?: FileList) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  statusText?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  onStop,
  isStreaming,
  statusText,
  disabled,
  placeholder,
}: MessageInputProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (isStreaming) return;

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
  }, [input, files, isStreaming, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isStreaming) return;

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
        'relative rounded-xl border bg-background shadow-sm transition-colors',
        isDragOver && 'border-primary bg-primary/5',
        'focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10',
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
              <span className="max-w-[150px] truncate text-xs">{file.name}</span>
              <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                aria-label={`Remove ${file.name}`}
                title={`Remove ${file.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 p-3">
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
          className="h-10 w-10 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isStreaming}
          aria-label="Attach files"
          title="Attach files"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Type a message...'}
          disabled={disabled || isStreaming}
          className="min-h-[40px] max-h-[200px] resize-none border-0 px-0 py-2.5 leading-5 focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={1}
        />
        {isStreaming ? (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="h-10 w-10 shrink-0"
            onClick={onStop}
            aria-label="Stop response"
            title="Stop response"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={handleSend}
            disabled={disabled || (!input.trim() && files.length === 0)}
            aria-label="Send message"
            title="Send message"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>
      {isStreaming && statusText && (
        <div className="px-3 pb-3">
          <p className="text-xs text-muted-foreground">{statusText}</p>
        </div>
      )}
      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/5">
          <p className="text-sm font-medium text-primary">Drop files here</p>
        </div>
      )}
    </div>
  );
}
