/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build configuration
  output: 'standalone',
  
  // Environment-specific settings
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Image optimization
  images: {
    domains: ['localhost', 'api.inspection-system.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Internationalization
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
    ]
  },
  
  // Rewrites for API proxy
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE_URL}/api/:path*`,
      },
    ]
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle analyzer in development
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: isServer ? 8888 : 8889,
          openAnalyzer: true,
        })
      )
    }
    
    // Service Worker
    if (!isServer && !dev) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.BUILD_ID': JSON.stringify(buildId),
        })
      )
    }
    
    return config
  },
  
  // Experimental features
  experimental: {
    // App directory
    appDir: true,
    
    // Server components
    serverComponentsExternalPackages: ['@prisma/client'],
    
    // Turbopack (for development)
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // TypeScript configuration
  typescript: {
    // Ignore build errors in production (not recommended for real projects)
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // Ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },
  
  // Power by header
  poweredByHeader: false,
  
  // Compression
  compress: true,
  
  // Trailing slash
  trailingSlash: false,
  
  // Page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  
  // React strict mode
  reactStrictMode: true,
  
  // SWC minification
  swcMinify: true,
}

module.exports = nextConfig