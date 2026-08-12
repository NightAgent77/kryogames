export function getDisplayName(email: string, username?: string | null) {
  if (username) return username
  return email.split('@')[0] || 'Player'
}

export function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

export function getAvatarUrl(user: {
  user_metadata?: Record<string, unknown>
} | null) {
  const avatar = user?.user_metadata?.avatar
  return typeof avatar === 'string' && avatar.length > 0 ? avatar : null
}

/** Resize an image file to a compact data URL for user_metadata. */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }

  const maxBytes = 2 * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error('Image must be under 2 MB.')
  }

  const bitmap = await createImageBitmap(file)
  const size = 256
  const scale = Math.min(size / bitmap.width, size / bitmap.height, 1)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Could not process image.')
  }

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const dataUrl = canvas.toDataURL('image/jpeg', 0.72)
  if (dataUrl.length > 120_000) {
    throw new Error('Image is too large after compression. Try a simpler photo.')
  }

  return dataUrl
}
