export async function getUploadToken(
  _filename: string,
  _sizeBytes: number
): Promise<{ uploadUrl: string; videoId: string }> {
  await delay(300)
  return {
    uploadUrl: 'https://mock-cos.example.com/upload',
    videoId: `video_${Date.now()}`,
  }
}

export async function notifyUploaded(_videoId: string): Promise<void> {
  await delay(200)
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
