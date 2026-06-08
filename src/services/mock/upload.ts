export async function getUploadQuota() {
  await delay(100)
  return {
    limit: 3,
    used: 0,
    remaining: 3,
    date: new Date().toISOString().slice(0, 10),
  }
}

export async function getUploadToken(
  _filename: string,
  _sizeBytes: number,
  _durationSec: number
): Promise<{ uploadUrl: string; videoId: string }> {
  await delay(300)
  return {
    uploadUrl: 'mock://local',
    videoId: `video_${Date.now()}`,
  }
}

export async function doUpload(
  _uploadUrl: string,
  _filePath: string,
  onProgress: (p: number) => void
): Promise<void> {
  for (let p = 0; p <= 100; p += 10) {
    onProgress(p)
    await delay(150)
  }
}

export async function notifyUploaded(_videoId: string): Promise<void> {
  await delay(200)
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
