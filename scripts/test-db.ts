import * as dotenv from 'dotenv'
import * as path from 'path'
import { Pool } from 'pg'

// Carregar .env da raiz do projeto
const envPath = path.resolve(__dirname, '..', '.env')
console.log('📂 Carregando .env de:', envPath)
dotenv.config({ path: envPath })

async function testConnection() {
  console.log('\n🔍 Testando conexão com o banco de dados...\n')
  
  const databaseUrl = process.env.DATABASE_URL
  
  console.log('📍 DATABASE_URL:', databaseUrl ? 'Encontrada' : 'NÃO ENCONTRADA')
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não está definida no arquivo .env')
    console.log('\nCrie um arquivo .env com:')
    console.log('DATABASE_URL="postgresql://usuario:senha@host:5432/banco?sslmode=require"')
    process.exit(1)
  }
  
  // Ocultar a senha na saída
  try {
    const urlParts = new URL(databaseUrl)
    console.log(`   Host: ${urlParts.host}`)
    console.log(`   Database: ${urlParts.pathname.slice(1)}`)
    console.log(`   User: ${urlParts.username}`)
    console.log(`   SSL: ${databaseUrl.includes('sslmode') ? 'Sim' : 'Não'}`)
  } catch {
    console.log('   URL: (formato inválido)')
  }
  
  try {
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    })
    
    console.log('\n⏳ Conectando...')
    
    const client = await pool.connect()
    
    // Testar query simples
    const result = await client.query('SELECT NOW() as time, current_database() as db')
    
    console.log('\n✅ Conexão bem-sucedida!')
    console.log(`   Banco: ${result.rows[0].db}`)
    console.log(`   Hora do servidor: ${result.rows[0].time}`)
    
    // Listar tabelas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log(`\n📊 Tabelas encontradas (${tables.rows.length}):`)
    if (tables.rows.length === 0) {
      console.log('   (nenhuma tabela - banco vazio)')
    } else {
      tables.rows.forEach((row: { table_name: string }) => {
        console.log(`   - ${row.table_name}`)
      })
    }
    
    client.release()
    await pool.end()
    
    console.log('\n🎉 Tudo certo! O banco está pronto para uso.\n')
    
  } catch (error) {
    console.error('\n❌ Erro ao conectar:', error instanceof Error ? error.message : error)
    console.log('\nVerifique:')
    console.log('  1. Se a URL está correta')
    console.log('  2. Se o IP está liberado no firewall do Render')
    console.log('  3. Se as credenciais estão corretas')
    process.exit(1)
  }
}

testConnection()
