// src/pages/Profile.tsx
// ⭐ NOUVEAU: Skeleton loader full-page (tsoloana ny ProfileSkeleton)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { X, LogOut } from 'lucide-react';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import ProfileForm from '../components/profile/ProfileForm';
import ProfileAvatar from '../components/profile/ProfileAvatar';
import ProfilePasswordModal from '../components/profile/ProfilePasswordModal';
import SuccessModal from '../components/common/SuccessModal';
import ErrorModal from '../components/common/ErrorModal';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
}

// ============================================================
// ⭐ SKELETON LOADER FULL-PAGE
// ============================================================

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md ${className}`} />
);

const ProfilePageSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const cardBg = isDark ? 'bg-white/[0.04]' : 'bg-slate-100';
  const surfaceBg = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const borderColor = isDark ? 'border-white/[0.10]' : 'border-slate-200';
  const pageBg = isDark ? '#0F172A' : '#FFFFFF';

  return (
    <div className="min-h-screen font-sans transition-colors duration-300" style={{ background: pageBg }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-4 px-2 py-4 sm:px-3 lg:px-5">

        {/* ⭐ HEADER SKELETON */}
        <div className={`rounded-xl border-[0.5px] p-4 ${surfaceBg} ${borderColor}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <SkeletonBlock className={`h-10 w-10 rounded-lg ${cardBg}`} />
              <div className="space-y-2">
                <SkeletonBlock className={`h-5 w-48 ${cardBg}`} />
                <SkeletonBlock className={`h-3 w-64 ${cardBg}`} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SkeletonBlock className={`h-9 w-24 rounded-lg ${cardBg}`} />
              <SkeletonBlock className={`h-9 w-28 rounded-lg ${cardBg}`} />
            </div>
          </div>
        </div>

        {/* ⭐ 2-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 gap-4 pb-8 lg:grid-cols-[30%_1fr]">

          {/* ⭐ SIDEBAR SKELETON */}
          <div className={`rounded-xl border-[0.5px] p-5 ${surfaceBg} ${borderColor}`}>
            {/* Avatar + Name */}
            <div className="flex flex-col items-center text-center">
              <SkeletonBlock className={`h-24 w-24 rounded-full ${cardBg}`} />
              <SkeletonBlock className={`mt-3 h-4 w-32 ${cardBg}`} />
              <SkeletonBlock className={`mt-2 h-3 w-24 ${cardBg}`} />
            </div>

            {/* Separator */}
            <div className={`my-5 border-t ${borderColor}`} />

            {/* Info items */}
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonBlock className={`h-8 w-8 shrink-0 rounded-lg ${cardBg}`} />
                  <div className="flex-1 space-y-1.5">
                    <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
                    <SkeletonBlock className={`h-3.5 w-32 ${cardBg}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Separator */}
            <div className={`my-5 border-t ${borderColor}`} />

            {/* Buttons */}
            <div className="space-y-2">
              <SkeletonBlock className={`h-9 w-full rounded-lg ${cardBg}`} />
              <SkeletonBlock className={`h-9 w-full rounded-lg ${cardBg}`} />
            </div>
          </div>

          {/* ⭐ MAIN CONTENT SKELETON */}
          <div className="flex flex-col gap-4">

            {/* Avatar card */}
            <div className={`rounded-xl border-[0.5px] p-5 ${surfaceBg} ${borderColor}`}>
              <div className="flex flex-wrap items-center gap-4">
                <SkeletonBlock className={`h-20 w-20 rounded-full ${cardBg}`} />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className={`h-4 w-40 ${cardBg}`} />
                  <SkeletonBlock className={`h-3 w-56 ${cardBg}`} />
                </div>
                <div className="flex items-center gap-2">
                  <SkeletonBlock className={`h-9 w-24 rounded-lg ${cardBg}`} />
                  <SkeletonBlock className={`h-9 w-9 rounded-lg ${cardBg}`} />
                </div>
              </div>
            </div>

            {/* Form card */}
            <div className={`rounded-xl border-[0.5px] p-5 ${surfaceBg} ${borderColor}`}>
              <div className="mb-5 flex items-center justify-between">
                <SkeletonBlock className={`h-4 w-40 ${cardBg}`} />
                <SkeletonBlock className={`h-3 w-24 ${cardBg}`} />
              </div>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <SkeletonBlock className={`h-3 w-20 ${cardBg}`} />
                    <SkeletonBlock className={`h-10 w-full rounded-lg ${cardBg}`} />
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <SkeletonBlock className={`h-9 w-24 rounded-lg ${cardBg}`} />
                <SkeletonBlock className={`h-9 w-28 rounded-lg ${cardBg}`} />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT
// ============================================================

const Profile: React.FC = () => {
  const { isDark } = useTheme();
  const { user, logout, setSession } = useAuth();
  const navigate = useNavigate();

  const [userLoading, setUserLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    firstName: '', lastName: '', email: '', phone: '', companyName: ''
  });
  const [originalData, setOriginalData] = useState<FormData>(formData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAQrCode, setTwoFAQrCode] = useState('');
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAPending, setTwoFAPending] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [successModal, setSuccessModal] = useState({
    isOpen: false, title: '', message: '', details: '', autoClose: 4000
  });
  const [errorModal, setErrorModal] = useState({
    isOpen: false, title: '', message: '', details: '', autoClose: 4000
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(true);

  const loadUserData = useCallback(async () => {
    if (!user?.id) { setUserLoading(false); return; }
    try {
      const result = await window.api.users.getById(user.id);
      if (result?.success && result.data) {
        const data = result.data;
        const newFormData = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          companyName: data.companyName || ''
        };
        setFormData(newFormData);
        setOriginalData(newFormData);
        setTwoFAEnabled(!!data.twoFactorEnabled);
        if (data.image) {
          try {
            const urlResult = await window.api.images.getUrl(data.image);
            if (urlResult?.success && urlResult.data) {
              setProfileImage(urlResult.data);
              setImageError(false);
            } else { setProfileImage(null); }
          } catch (_) { setProfileImage(null); }
        }
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      setErrorModal({
        isOpen: true,
        title: 'Erreur de chargement',
        message: 'Impossible de charger les informations de votre profil.',
        details: (error as Error).message || 'Erreur inconnue',
        autoClose: 5000
      });
    } finally {
      if (isMounted.current) setUserLoading(false);
    }
  }, [user]);

  useEffect(() => { loadUserData(); }, [loadUserData]);
  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => { setFormData(originalData); setIsEditing(false); setErrors({}); };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Prénom requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Nom requis';
    if (!formData.email.trim()) newErrors.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.companyName.trim()) newErrors.companyName = "Nom de l'entreprise requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const updatedData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        companyName: formData.companyName.trim()
      };
      const result = await window.api.users.update(user?.id, updatedData);
      if (result?.success) {
        const updatedUser = { ...user, ...updatedData };
        const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
        if (token) setSession(token, updatedUser);
        setOriginalData(updatedData);
        setIsEditing(false);
        setSuccessModal({
          isOpen: true,
          title: 'Profil mis à jour',
          message: 'Vos informations personnelles ont été enregistrées avec succès.',
          details: `Bonjour ${updatedData.firstName}, vos modifications sont maintenant actives.`,
          autoClose: 4000
        });
      } else {
        throw new Error(result?.error || 'Erreur mise à jour');
      }
    } catch (error: any) {
      setErrorModal({
        isOpen: true,
        title: 'Échec de la mise à jour',
        message: 'Une erreur est survenue lors de l\'enregistrement de vos informations.',
        details: error.message || 'Erreur inconnue',
        autoClose: 5000
      });
    } finally { setSaving(false); }
  };

  const handleImageChange = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorModal({
        isOpen: true, title: 'Format invalide',
        message: 'Veuillez sélectionner une image valide.',
        details: 'Les formats acceptés sont : JPG, PNG, WEBP, etc.', autoClose: 4000
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorModal({
        isOpen: true, title: 'Fichier trop volumineux',
        message: "L'image ne doit pas dépasser 5 Mo.",
        details: 'Veuillez compresser votre image avant de la télécharger.', autoClose: 4000
      });
      return;
    }
    setUploadingImage(true);
    setImageError(false);
    const localUrl = URL.createObjectURL(file);
    setProfileImage(localUrl);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const uploadResult = await window.api.images.upload(base64, 'utilisateurs');
      if (!uploadResult?.success) throw new Error(uploadResult?.error || 'Upload échoué');
      const imagePath = uploadResult.data;
      const updateResult = await window.api.users.update(user?.id, { image: imagePath });
      if (!updateResult?.success) throw new Error(updateResult?.error || 'Mise à jour échouée');
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
      if (token) {
        const updatedUser = { ...user, image: imagePath };
        setSession(token, updatedUser);
      }
      setProfileImage(localUrl);
      setImageError(false);
      setSuccessModal({
        isOpen: true,
        title: 'Photo de profil mise à jour',
        message: 'Votre photo de profil a été modifiée avec succès.',
        details: "L'image sera visible sur toutes les interfaces de l'application.",
        autoClose: 4000
      });
    } catch (error: any) {
      setImageError(true);
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
      if (token && user?.image) {
        try {
          const urlResult = await window.api.images.getUrl(user.image);
          if (urlResult?.success && urlResult.data) setProfileImage(urlResult.data);
          else setProfileImage(null);
        } catch (_) { setProfileImage(null); }
      } else { setProfileImage(null); }
      setErrorModal({
        isOpen: true,
        title: 'Erreur de téléchargement',
        message: "Nous n'avons pas pu mettre à jour votre photo de profil.",
        details: error.message || 'Erreur inconnue',
        autoClose: 5000
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async () => {
    setUploadingImage(true);
    try {
      const result = await window.api.users.update(user?.id, { image: null });
      if (!result?.success) throw new Error(result?.error || 'Erreur suppression');
      setProfileImage(null);
      setImageError(false);
      setSuccessModal({
        isOpen: true,
        title: 'Photo supprimée',
        message: 'Votre photo de profil a été supprimée.',
        details: 'Vous pouvez en télécharger une nouvelle à tout moment.',
        autoClose: 4000
      });
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
      if (token) {
        const updatedUser = { ...user, image: null };
        setSession(token, updatedUser);
      }
    } catch (error: any) {
      setErrorModal({
        isOpen: true,
        title: 'Erreur de suppression',
        message: 'Impossible de supprimer la photo.',
        details: error.message || 'Erreur inconnue',
        autoClose: 5000
      });
    } finally { setUploadingImage(false); }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setErrorModal({
        isOpen: true, title: 'Session expirée',
        message: 'Votre session semble expirée. Veuillez vous reconnecter.',
        details: "Impossible d'identifier l'utilisateur.", autoClose: 5000
      });
      return;
    }
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setErrorModal({
        isOpen: true, title: 'Champs incomplets',
        message: 'Veuillez remplir tous les champs du formulaire.',
        details: 'Le mot de passe actuel, le nouveau mot de passe et la confirmation sont obligatoires.',
        autoClose: 4000
      });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorModal({
        isOpen: true, title: 'Mots de passe différents',
        message: 'Les champs "Nouveau mot de passe" et "Confirmation" ne correspondent pas.',
        details: 'Veuillez les saisir à nouveau avec attention.',
        autoClose: 4000
      });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setErrorModal({
        isOpen: true, title: 'Mot de passe trop court',
        message: 'Le mot de passe doit contenir au moins 8 caractères.',
        details: 'Pour plus de sécurité, utilisez des majuscules, minuscules et chiffres.',
        autoClose: 4000
      });
      return;
    }
    setPasswordLoading(true);
    try {
      const result = await window.api.auth.changePassword({
        userId: user.id,
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (result?.success) {
        setSuccessModal({
          isOpen: true,
          title: 'Mot de passe modifié',
          message: 'Votre mot de passe a été changé avec succès.',
          details: 'Vous serez déconnecté pour des raisons de sécurité.',
          autoClose: 4000
        });
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => { logout(); navigate('/login'); }, 1500);
      } else {
        throw new Error(result?.error || 'Erreur modification');
      }
    } catch (error: any) {
      setErrorModal({
        isOpen: true,
        title: 'Échec du changement',
        message: 'Impossible de modifier votre mot de passe.',
        details: error.message || 'Erreur inconnue',
        autoClose: 5000
      });
    } finally { setPasswordLoading(false); }
  };

  const handleConfirmLogout = () => { setShowLogoutModal(false); logout(); navigate('/login'); };

  const role = user?.role || 'Utilisateur';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : 'N/A';

  const bgColor = isDark ? '#0F172A' : '#FFFFFF';
  const cardColor = isDark ? '#0F172A' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0';
  const footerBg = isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const mutedColor = isDark ? '#94A3B8' : '#64748B';

  // ============================================================
  // ⭐ SKELETON FULL-PAGE — alohan'ny render ny page
  // ============================================================
  if (userLoading) {
    return <ProfilePageSkeleton isDark={isDark} />;
  }

  return (
    <div className="min-h-screen font-sans transition-colors duration-300" style={{ background: bgColor }}>
      <div className="mx-auto w-full max-w-[1600px] space-y-4 px-2 py-4 sm:px-3 lg:px-5">

        <div className="mb-4">
          <ProfileHeader role={role} isEditing={isEditing} saving={saving} onEdit={handleEdit} onCancel={handleCancel} onSave={handleSave} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[30%_1fr] gap-4 pb-8">
          <div>
            <ProfileSidebar role={role} memberSince={memberSince} companyName={formData.companyName} twoFAEnabled={twoFAEnabled} onPasswordChange={() => setShowPasswordModal(true)} onLogout={() => setShowLogoutModal(true)} />
          </div>
          <div className="flex flex-col gap-4">
            <ProfileAvatar imagePreview={profileImage} uploadingImage={uploadingImage} firstName={formData.firstName} lastName={formData.lastName} onImageUpload={handleImageChange} onImageRemove={handleRemoveImage} uploadProgress={uploadingImage ? 50 : 0} error={imageError ? "Erreur de chargement de l'image" : null} />
            <input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleImageChange(e.target.files[0]); }} className="hidden" />
            <div className="w-full">
              <ProfileForm formData={formData} onChange={handleFormChange} errors={errors} isEditing={isEditing} onSubmit={(e) => e.preventDefault()} />
            </div>
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        title={successModal.title}
        message={successModal.message}
        details={successModal.details}
        autoCloseDelay={successModal.autoClose}
        isDark={isDark}
      />
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
        autoCloseDelay={errorModal.autoClose}
        isDark={isDark}
      />

      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative max-w-sm w-full rounded-xl shadow-2xl border overflow-hidden" style={{ background: cardColor, borderColor: borderColor }}>
            <button
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-3.5 right-3.5 p-1 rounded-lg transition-colors hover:bg-[#4F46E5]/10 dark:hover:bg-white/[0.06] cursor-pointer z-10"
              style={{ color: mutedColor }}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center pt-5 pb-2">
              <img src="./images/logolight.png" alt="Logo" className="w-16 h-auto object-contain" />
            </div>

            <div className="px-5 py-3 flex items-center justify-center border-b" style={{ borderColor: borderColor }}>
              <h2 className="text-[14px] font-bold" style={{ color: textColor }}>Déconnexion</h2>
            </div>

            <div className="p-5">
              <p className="text-[14px] font-medium leading-tight text-center" style={{ color: textColor }}>
                Êtes-vous sûr de vouloir vous déconnecter ?
              </p>
              <p className="text-[12.5px] mt-1.5 leading-[1.3] text-center" style={{ color: mutedColor }}>
                Vous devrez entrer vos identifiants pour vous reconnecter.
              </p>
            </div>

            <div className="flex gap-2.5 px-5 py-3 border-t" style={{ borderColor: borderColor, background: footerBg }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border text-[13px] font-medium transition-colors"
                style={{ borderColor: borderColor, color: mutedColor }}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-brand-500 hover:bg-brand-600 transition-colors"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      <ProfilePasswordModal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
        onSubmit={handlePasswordSubmit}
        passwordData={passwordData}
        onPasswordDataChange={setPasswordData}
        passwordLoading={passwordLoading}
        isDark={isDark}
      />
    </div>
  );
};

export default Profile;