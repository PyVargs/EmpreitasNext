import * as dotenv from 'dotenv'
import * as path from 'path'
import { Pool } from 'pg'

dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  
  try {
    const result = await pool.query('SELECT id, login, nome, admin, ativo, senha_hash FROM usuarios WHERE ativo = true')
    console.log('=== Usuários ativos ===\n')
    
    result.rows.forEach((user: { id: number, login: string, nome: string, admin: boolean, ativo: boolean, senha_hash: string | null }) => {
      console.log(`ID: ${user.id}`)
      console.log(`Login: ${user.login}`)
      console.log(`Nome: ${user.nome}`)
      console.log(`Admin: ${user.admin}`)
      
      if (user.senha_hash) {
        // Verificar tipo de hash
        if (user.senha_hash.startsWith('$2')) {
          console.log(`Senha: Hash bcrypt válido`)
        } else if (user.senha_hash.startsWith('pbkdf2:')) {
          console.log(`Senha: Hash werkzeug (Flask) - INCOMPATÍVEL com bcrypt!`)
        } else if (user.senha_hash.startsWith('scrypt:')) {
          console.log(`Senha: Hash scrypt (Flask) - INCOMPATÍVEL com bcrypt!`)
        } else {
          console.log(`Senha: Formato desconhecido - ${user.senha_hash.substring(0, 20)}...`)
        }
      } else {
        console.log(`Senha: NÃO DEFINIDA`)
      }
      console.log('---')
    })
  } catch (error) {
    console.error('Erro:', error)
  }
  
  await pool.end()
}

main()
