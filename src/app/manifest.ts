import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Alfamidi App',
    short_name: 'Alfamidi',
    description: 'Aplikasi internal Alfamidi',
    start_url: '/login',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0c539a',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
