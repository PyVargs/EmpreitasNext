import bcrypt from 'bcryptjs'
import crypto from 'crypto'

/**
 * Verifica senha contra hash werkzeug (Flask) ou bcrypt
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Formato bcrypt: $2a$..., $2b$..., $2y$...
  if (hash.startsWith('$2')) {
    return bcrypt.compare(password, hash)
  }
  
  // Formato werkzeug pbkdf2: pbkdf2:sha256:iterations$salt$hash
  if (hash.startsWith('pbkdf2:')) {
    return verifyWerkzeugPbkdf2(password, hash)
  }
  
  console.warn('Formato de hash desconhecido:', hash.substring(0, 20))
  return false
}

/**
 * Verifica senha werkzeug pbkdf2
 * Formato: pbkdf2:sha256:iterations$salt$hash
 */
function verifyWerkzeugPbkdf2(password: string, hash: string): boolean {
  try {
    // Formato: pbkdf2:método:iterações$salt$hash
    const parts = hash.split('$')
    if (parts.length !== 3) {
      console.error('Formato pbkdf2 inválido')
      return false
    }
    
    const [methodPart, salt, storedHash] = parts
    const methodParts = methodPart.split(':')
    
    if (methodParts.length < 3) {
      console.error('Método pbkdf2 inválido')
      return false
    }
    
    const hashMethod = methodParts[1] // sha256
    const iterations = parseInt(methodParts[2], 10)
    
    // Werkzeug usa 32 bytes (256 bits) por padrão
    const derivedKey = crypto.pbkdf2Sync(
      password,
      salt,
      iterations,
      32,
      hashMethod
    )
    
    const derivedHash = derivedKey.toString('hex')
    return derivedHash === storedHash
  } catch (error) {
    console.error('Erro ao verificar senha pbkdf2:', error)
    return false
  }
}

/**
 * Gera hash bcrypt para novas senhas
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}
