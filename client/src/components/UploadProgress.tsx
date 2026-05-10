import React, { useEffect, useRef } from 'react';
import { FileUp, CheckCircle, XCircle } from 'lucide-react';
import gsap from 'gsap';

export interface UploadState {
  filename: string;
  progress: number; // 0-100
  status: 'uploading' | 'success' | 'error';
}

interface UploadProgressProps {
  upload: UploadState | null;
  onDismiss: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ upload, onDismiss }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Entrance animation
  useEffect(() => {
    if (upload && containerRef.current) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }
      );
    }
  }, [upload?.filename]);

  // Progress bar animation
  useEffect(() => {
    if (upload && barRef.current) {
      gsap.to(barRef.current, {
        width: `${upload.progress}%`,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [upload?.progress]);

  // Auto-dismiss after success/error
  useEffect(() => {
    if (upload && (upload.status === 'success' || upload.status === 'error')) {
      dismissTimerRef.current = setTimeout(() => {
        if (containerRef.current) {
          gsap.to(containerRef.current, {
            opacity: 0,
            y: 20,
            scale: 0.95,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: onDismiss,
          });
        }
      }, 2500);
    }
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [upload?.status, onDismiss]);

  if (!upload) return null;

  const statusConfig = {
    uploading: {
      icon: <FileUp size={18} className="animate-pulse" />,
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-cyan-400',
      barBg: 'bg-gradient-to-r from-blue-500 to-cyan-400',
      label: 'Uploading...',
    },
    success: {
      icon: <CheckCircle size={18} />,
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-green-400',
      barBg: 'bg-gradient-to-r from-emerald-500 to-green-400',
      label: 'Upload complete',
    },
    error: {
      icon: <XCircle size={18} />,
      gradientFrom: 'from-red-500',
      gradientTo: 'to-rose-400',
      barBg: 'bg-gradient-to-r from-red-500 to-rose-400',
      label: 'Upload failed',
    },
  };

  const config = statusConfig[upload.status];

  // Truncate long filenames
  const displayName = upload.filename.length > 30
    ? upload.filename.slice(0, 27) + '...'
    : upload.filename;

  return (
    <div
      ref={containerRef}
      id="upload-progress-toast"
      className="fixed bottom-6 left-6 z-50 w-80"
      style={{ opacity: 0 }}
    >
      <div className="glass-card rounded-2xl p-4 border border-white/10 shadow-2xl">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} flex items-center justify-center shrink-0`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/50 font-medium">{config.label}</p>
            <p className="text-sm font-semibold text-white truncate" title={upload.filename}>
              {displayName}
            </p>
          </div>
          {upload.status === 'uploading' && (
            <span className="text-xs font-mono text-white/60 tabular-nums">
              {Math.round(upload.progress)}%
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            ref={barRef}
            className={`h-full rounded-full ${config.barBg} transition-shadow`}
            style={{
              width: '0%',
              boxShadow: upload.status === 'uploading'
                ? '0 0 12px rgba(59, 130, 246, 0.5)'
                : upload.status === 'success'
                  ? '0 0 12px rgba(16, 185, 129, 0.5)'
                  : '0 0 12px rgba(239, 68, 68, 0.5)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
