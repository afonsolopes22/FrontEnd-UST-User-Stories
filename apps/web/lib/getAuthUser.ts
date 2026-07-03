export function getUserIdFromRequest(request: Request): string | null {
  const auth = request.headers.get('Authorization') ?? request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
    return decoded.sub ? String(decoded.sub) : null
  } catch {
    return null
  }
}
