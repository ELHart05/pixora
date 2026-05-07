import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BsPersonCircle, BsCheck2, BsArrowLeft, BsCamera, BsXLg } from 'react-icons/bs';
import { trpc } from '../lib/trpc';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SiteFooter, SiteNavbar } from '../components/SiteChrome';

/** Upload a File object to ImgBB and return the public URL */
async function uploadFileToImgBB(file) {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) throw new Error('VITE_IMGBB_API_KEY is not set');

  const body = new FormData();
  body.append('key', apiKey);
  body.append('image', file);

  const res = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body,
  });

  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const json = await res.json();
  if (!json.success) throw new Error('Upload unsuccessful');
  return json.data.url;
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const me = trpc.user.me.useQuery(undefined, { enabled: !!user });

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Populate form when data arrives
  useEffect(() => {
    if (me.data) {
      setName(me.data.name ?? '');
      setUsername(me.data.username ?? '');
      setBio(me.data.bio ?? '');
      setAvatar(me.data.avatar ?? '');
      setAvatarPreview(me.data.avatar ?? '');
    }
  }, [me.data]);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async (updatedProfile) => {
      const invalidations = [
        utils.user.me.invalidate(),
        utils.auth.me.invalidate(),
        utils.canvas.feed.invalidate(),
        utils.canvas.publicList.invalidate(),
        utils.canvas.byId.invalidate(),
        utils.user.topCreators.invalidate(),
        utils.user.creatorsList.invalidate(),
      ];
      const previousUsername = me.data?.username;
      if (previousUsername) {
        invalidations.push(utils.user.byUsername.invalidate({ username: previousUsername }));
      }
      if (updatedProfile.username && updatedProfile.username !== previousUsername) {
        invalidations.push(utils.user.byUsername.invalidate({ username: updatedProfile.username }));
      }
      await Promise.all(invalidations);

      setName(updatedProfile.name ?? '');
      setUsername(updatedProfile.username ?? '');
      setBio(updatedProfile.bio ?? '');
      setAvatar(updatedProfile.avatar ?? '');
      setAvatarPreview(updatedProfile.avatar ?? '');
      setSaved(true);
      setError('');
      toast.success('Profile updated!');
      setTimeout(() => setSaved(false), 3000);

      if (updatedProfile.username) {
        navigate(`/u/${updatedProfile.username}`, { replace: true });
      }
    },
    onError: (err) => {
      setError(err.message ?? 'Something went wrong');
      toast.error('Failed to update profile.');
    },
  });

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB.');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function removeAvatar() {
    setAvatarFile(null);
    setAvatarPreview('');
    setAvatar('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaved(false);

    let avatarUrl = avatar;

    // Upload new avatar file if selected
    if (avatarFile) {
      try {
        setUploading(true);
        avatarUrl = await uploadFileToImgBB(avatarFile);
        setAvatar(avatarUrl);
        setAvatarFile(null);
      } catch {
        toast.error('Avatar upload failed. Please try again.');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    updateProfile.mutate({
      name: name || undefined,
      username: username || undefined,
      bio: bio || undefined,
      avatar: avatarUrl || undefined,
    });
  }

  if (authLoading || me.isLoading) {
    return (
      <div className="min-h-screen bg-[#0e0f14] flex items-center justify-center text-white/30 text-sm">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0e0f14] flex flex-col items-center justify-center gap-3">
        <p className="text-white/40">Sign in to edit your profile</p>
        <Link to="/" className="text-indigo-400 hover:underline text-sm">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col">
      <SiteNavbar maxWidth="max-w-2xl" />

      <div className="flex-1 max-w-2xl mx-auto px-4 pt-24 pb-12 w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"
          >
            <BsArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Edit profile</h1>
            <p className="text-white/35 text-sm">Update your public profile information</p>
          </div>
        </div>

        {/* Avatar upload section */}
        <div className="flex items-center gap-5 mb-8">
          <div className="relative group">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-white/10" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <BsPersonCircle size={44} className="text-indigo-300" />
              </div>
            )}
            {/* Upload overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <BsCamera size={20} className="text-white" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 hover:bg-indigo-500/25 text-xs font-semibold transition-all"
              >
                <BsCamera size={12} className="inline mr-1.5" />
                {avatarPreview ? 'Change photo' : 'Upload photo'}
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="px-3 py-2 rounded-lg bg-white/5 text-white/40 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-xs font-semibold transition-all"
                >
                  <BsXLg size={10} className="inline mr-1" />
                  Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-white/25">JPG, PNG or GIF. Max 5 MB.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Name preview */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {avatarPreview ? (
            <img src={avatarPreview} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <BsPersonCircle size={22} className="text-white/20" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{name || 'Your name'}</p>
            <p className="text-white/30 text-xs">{username ? `@${username}` : 'no username set'}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              Display name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="Your display name"
              className="w-full px-4 py-3 bg-[#1a1c24] border border-white/[0.08] rounded-xl text-sm outline-none focus:border-indigo-500/50 placeholder-white/20 transition-colors"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                maxLength={30}
                minLength={3}
                placeholder="your_username"
                className="w-full pl-8 pr-4 py-3 bg-[#1a1c24] border border-white/[0.08] rounded-xl text-sm outline-none focus:border-indigo-500/50 placeholder-white/20 transition-colors"
              />
            </div>
            <p className="text-[11px] text-white/25 mt-1.5">
              3–30 characters. Letters, numbers, _ and - only. Used in your public profile URL.
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="A short description about yourself…"
              className="w-full px-4 py-3 bg-[#1a1c24] border border-white/[0.08] rounded-xl text-sm outline-none focus:border-indigo-500/50 placeholder-white/20 transition-colors resize-none"
            />
            <p className="text-[11px] text-white/25 mt-1">{bio.length}/200</p>
          </div>

          {/* Error / success */}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}
          {saved && (
            <p className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
              <BsCheck2 size={16} /> Profile saved!
            </p>
          )}

          <button
            type="submit"
            disabled={updateProfile.isLoading || uploading}
            className="mt-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 font-semibold text-sm transition-all"
          >
            {uploading ? 'Uploading avatar…' : updateProfile.isLoading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
      <SiteFooter maxWidth="max-w-2xl" />
    </div>
  );
}
