/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security Headers
  async headers() {
    return [
      {
        // Aplicar a todas as rotas
        source: '/:path*',
        headers: [
          {
            // Previne ataques XSS
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            // Previne clickjacking (iframe embedding)
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            // Previne MIME type sniffing
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Controla informações do Referer
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Controla permissões do navegador
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            // Força HTTPS em produção
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            // Content Security Policy - previne XSS e injeção de código
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'", // Next.js + WASM
              "style-src 'self' 'unsafe-inline'", // Tailwind precisa
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https:",
              "connect-src 'self' data: blob: https:", // PDF generation
              "frame-ancestors 'self'",
              "form-action 'self'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  
  // Desabilitar o header X-Powered-By (esconde que é Next.js)
  poweredByHeader: false,
};

export default nextConfig;
