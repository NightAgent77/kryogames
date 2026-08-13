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

export function getBannerUrl(user: {
  user_metadata?: Record<string, unknown>
} | null) {
  const banner = user?.user_metadata?.banner
  return typeof banner === 'string' && banner.length > 0 ? banner : null
}

export function getBio(user: {
  user_metadata?: Record<string, unknown>
} | null) {
  const bio = user?.user_metadata?.bio
  return typeof bio === 'string' ? bio : ''
}

async function assertImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }

  const maxBytes = 2 * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error('Image must be under 2 MB.')
  }
}

/** Resize an image file to a compact data URL for user_metadata. */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  await assertImageFile(file)

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

/** Wide banner crop for profile header (stored in user_metadata). */
export async function fileToBannerDataUrl(file: File): Promise<string> {
  await assertImageFile(file)

  const bitmap = await createImageBitmap(file)
  const targetW = 1280
  const targetH = 420
  const scale = Math.max(targetW / bitmap.width, targetH / bitmap.height)
  const drawW = Math.round(bitmap.width * scale)
  const drawH = Math.round(bitmap.height * scale)
  const offsetX = Math.round((targetW - drawW) / 2)
  const offsetY = Math.round((targetH - drawH) / 2)

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Could not process image.')
  }

  ctx.fillStyle = '#1a1c22'
  ctx.fillRect(0, 0, targetW, targetH)
  ctx.drawImage(bitmap, offsetX, offsetY, drawW, drawH)
  bitmap.close()

  const dataUrl = canvas.toDataURL('image/jpeg', 0.68)
  if (dataUrl.length > 220_000) {
    throw new Error('Banner is too large after compression. Try a simpler image.')
  }

  return dataUrl
}
