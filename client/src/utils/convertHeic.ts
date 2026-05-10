export async function normalizeImageFile(file: File): Promise<File> {
  const { isHeic, heicTo } = await import('heic-to')
  if (!(await isHeic(file))) return file
  const blob = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 })
  const jpegName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
  return new File([blob], jpegName, { type: 'image/jpeg' })
}

export async function normalizeImageFiles(files: FileList | File[]): Promise<File[]> {
  return Promise.all(Array.from(files).map(normalizeImageFile))
}
