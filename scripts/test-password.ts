import * as dotenv from 'dotenv'
import * as path from 'path'
import { Pool } from 'pg'
import crypto from 'crypto'

dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

function verifyWerkzeugPbkdf2(password: string, hash: string): boolean {
  try {
    const parts = hash.split('$')
    if (parts.length !== 3) {
      console.error('Formato pbkdf2 inválido - esperado 3 partes, encontrado:', parts.length)
      return false
    }
    
    const [methodPart, salt, storedHash] = parts
    const methodParts = methodPart.split(':')
    
    console.log('  Method:', methodParts[0])
    console.log('  Hash algo:', methodParts[1])
    console.log('  Iterations:', methodParts[2])
    console.log('  Salt:', salt)
    console.log('  Stored hash:', storedHash.substring(0, 20) + '...')
    
    const hashMethod = methodParts[1] // sha256
    const iterations = parseInt(methodParts[2], 10)
    
    const derivedKey = crypto.pbkdf2Sync(
      password,
      salt,
      iterations,
      32,
      hashMethod
    )
    
    const derivedHash = derivedKey.toString('hex')
    console.log('  Derived hash:', derivedHash.substring(0, 20) + '...')
    console.log('  Match:', derivedHash === storedHash)
    
    return derivedHash === storedHash
  } catch (error) {
    console.error('Erro:', error)
    return false
  }
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  
  // Pegar o usuário admin para teste
  const result = await pool.query("SELECT login, senha_hash FROM usuarios WHERE login = 'admin' LIMIT 1")
  
  if (result.rows.length === 0) {
    console.log('Usuário admin não encontrado')
    await pool.end()
    return
  }
  
  const user = result.rows[0]
  console.log('\n=== Testando verificação de senha ===')
  console.log('Login:', user.login)
  console.log('Hash completo:', user.senha_hash)
  console.log('')
  
  // Teste com uma senha de exemplo (você pode trocar pela senha real para testar)
  const testPassword = 'vbs151481' // Senha de teste
  console.log('Testando com senha:', testPassword)
  console.log('')
  
  const isValid = verifyWerkzeugPbkdf2(testPassword, user.senha_hash)
  console.log('\nResultado:', isValid ? '✅ Senha correta!' : '❌ Senha incorreta')
  
  await pool.end()
}

main().catch(console.error)
