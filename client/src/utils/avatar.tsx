import React from 'react';

/**
 * Get avatar URL with cache busting
 * Appends timestamp query parameter to force CDN cache refresh
 */
export const getAvatarUrl = (photoUrl: string | null | undefined): string | null => {
  if (!photoUrl) return null;
  
  // Add cache busting parameter
  const separator = photoUrl.includes('?') ? '&' : '?';
  return `${photoUrl}${separator}v=${Date.now()}`;
};

/**
 * Get user initials for avatar fallback
 */
export const getUserInitials = (
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null
): string => {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName[0].toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return 'A';
};

/**
 * Avatar component with photo fallback to initials
 */
interface AvatarProps {
  photoUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
  showCacheBusting?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  photoUrl,
  firstName,
  lastName,
  email,
  size = 40,
  className = '',
  showCacheBusting = true,
}) => {
  const avatarUrl = showCacheBusting && photoUrl 
    ? getAvatarUrl(photoUrl) 
    : photoUrl || null;
  const initials = getUserInitials(firstName, lastName, email);

  return (
    <div
      className={`rounded-full flex items-center justify-center overflow-hidden bg-gray-200 ${className}`}
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${firstName || ''} ${lastName || ''}`.trim() || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<span class="text-gray-600 font-semibold" style="font-size: ${size * 0.4}px">${initials}</span>`;
            }
          }}
        />
      ) : (
        <span
          className="text-gray-600 font-semibold"
          style={{ fontSize: size * 0.4 }}
        >
          {initials}
        </span>
      )}
    </div>
  );
};

