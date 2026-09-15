// src/components/profile/ProfileAvatar.tsx
// ⭐ INDIGO (#4F46E5) + SLATE (#0F172A) DARK MODE
// ⭐ TYPOGRAPHIE alignée sur ProfileSidebar / ProfileForm
// ⭐ FONT SIZE: h3 15px, subtitle 13px, buttons 14px

import React, { useRef, useEffect } from 'react';
import { Camera, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ProfileAvatarProps {
  imagePreview: string | null;
  uploadingImage: boolean;
  firstName: string;
  lastName: string;
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  uploadProgress: number;
  error: string | null;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ imagePreview, uploadingImage, firstName, lastName, onImageUpload, onImageRemove, uploadProgress, error }) => {
  const { isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '?';

  const handleFileClick = () => { fileInputRef.current?.click(); };

  useEffect(() => { return () => { if (imagePreview && imagePreview.startsWith('blob:')) { URL.revokeObjectURL(imagePreview); } }; }, [imagePreview]);

  return (
    <div className="overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white shadow-sm transition-colors dark:border-white/[0.12] dark:bg-[#0F172A]">
      <div className="flex flex-col items-center gap-4 p-4 sm:flex-row sm:items-center">

        <div className="group relative flex-shrink-0">
          {/* ⭐ Avatar : h-72 w-72 → h-80 w-80 */}
          <div className="relative flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-slate-50 shadow-sm dark:border-white/[0.12] dark:bg-white/[0.03]">
            {uploadingImage ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            ) : imagePreview ? (
              <img src={imagePreview} alt="Profile" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              /* ⭐ Initials : text-lg → text-xl */
              <span className="text-xl font-bold text-brand-500 dark:text-brand-400">{initials}</span>
            )}
          </div>

          {/* ⭐ Camera button : icon 14 → 15 */}
          <div onClick={handleFileClick} className="absolute bottom-0 right-0 cursor-pointer rounded-full border-2 border-white bg-brand-500 p-1.5 text-white shadow-md transition-colors hover:bg-brand-600 dark:border-[#0F172A]">
            <Camera size={15} strokeWidth={2.2} />
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onImageUpload(e.target.files[0]); }} />
        </div>

        <div className="flex-1 text-center sm:text-left">
          {/* ⭐ h3 : 13.5px → 15px */}
          <h3 className="text-[15px] font-bold leading-tight text-slate-900 dark:text-slate-100">{firstName} {lastName}</h3>
          {/* ⭐ Subtitle : 11.5px → 13px */}
          <p className="mt-0.5 text-[13px] leading-[1.3] text-slate-500 dark:text-slate-400">{imagePreview ? 'Photo de profil personnalisée' : 'Aucune photo de profil'}</p>

          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
            {uploadingImage ? (
              /* ⭐ Loading text : 12.5px → 13.5px */
              <div className="flex items-center gap-2 text-[13.5px] font-medium text-brand-500 dark:text-brand-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Téléchargement en cours...
              </div>
            ) : (
              <>
                {/* ⭐ Changer button : 13px → 14px, icon 13 → 14 */}
                <button onClick={handleFileClick} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-brand-600">
                  <UploadCloud size={14} strokeWidth={2.2} />
                  Changer de photo
                </button>

                {imagePreview && !uploadingImage && (
                  /* ⭐ Supprimer button : 13px → 14px, icon 13 → 14 */
                  <button onClick={onImageRemove} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-red-600">
                    <Trash2 size={14} strokeWidth={2.2} />
                    Supprimer
                  </button>
                )}
              </>
            )}
          </div>
          {/* ⭐ Error : 11.5px → 12.5px */}
          {error && <p className="mt-1.5 text-[12.5px] font-medium text-red-500 dark:text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ProfileAvatar;