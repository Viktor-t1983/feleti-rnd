import Fastify from 'fastify'
import cors from '@fastify/cors'

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
})

// CORS
fastify.register(cors, {
  origin: 'http://localhost:5173',
  credentials: true,
})

// Health check
fastify.get('/health', async () => {
  return { status: 'ok' }
})

fastify.get('/', async () => {
  return { 
    status: 'ok',
    service: 'FELETI R&D API',
    version: '1.0.0'
  }
})

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' })
    console.log(' API Server running on http://localhost:3001')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
