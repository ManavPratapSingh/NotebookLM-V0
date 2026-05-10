import React, { useRef } from 'react';
import { FileText, Plus } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { type UploadState } from './UploadProgress';

interface SidebarProps {
  documents: string[];
  onUpload: (filename: string) => void;
  onUploadProgress: (state: UploadState | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ documents, onUpload, onUploadProgress }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine the correct endpoint based on file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    let uploadUrl: string;

    if (extension === 'pdf') {
      uploadUrl = `${API_BASE_URL}/api/upload-pdf`;
    } else if (extension === 'csv') {
      uploadUrl = `${API_BASE_URL}/api/upload-csv`;
    } else {
      console.error('Unsupported file type:', extension);
      onUploadProgress({
        filename: file.name,
        progress: 100,
        status: 'error',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    // Initialize upload progress
    onUploadProgress({
      filename: file.name,
      progress: 0,
      status: 'uploading',
    });

    try {
      await axios.post(uploadUrl, formData, {
        onUploadProgress: (progressEvent) => {
          const percent = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          onUploadProgress({
            filename: file.name,
            progress: percent,
            status: 'uploading',
          });
        },
      });

      // Mark as success
      onUploadProgress({
        filename: file.name,
        progress: 100,
        status: 'success',
      });
      onUpload(file.name);
    } catch (error) {
      console.error('Upload failed:', error);
      onUploadProgress({
        filename: file.name,
        progress: 100,
        status: 'error',
      });
    }

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <aside className="w-80 h-full border-r border-white/5 backdrop-blur-md flex flex-col p-6 gap-6 entrance-anim">
      <button 
        onClick={handleUploadClick}
        className="w-full py-4 glass-card rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-95 group overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
        <span className="font-medium">UPLOAD FILE</span>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".pdf,.csv"
        />
      </button>

      <div className="flex-1 flex flex-col gap-4">
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest px-2">Your Knowledge</h3>
        <div className="flex flex-col gap-2 overflow-y-auto pr-2">
          {documents.length === 0 ? (
            <div className="text-sm text-white/20 italic px-2 py-4 border border-dashed border-white/10 rounded-xl text-center">
              No documents yet
            </div>
          ) : (
            documents.map((doc, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10">
                  <FileText size={16} className="text-white/60" />
                </div>
                <span className="text-sm font-medium truncate flex-1">{doc}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-auto glass-card p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px]">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xs font-bold">
              MA
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Manav</span>
            <span className="text-[10px] text-white/40">Free Tier Account</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
