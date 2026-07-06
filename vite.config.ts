import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  server: {
    proxy: {
      "/uploads": "http://localhost:3001",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心框架
          'vendor-react': ['react', 'react-dom', 'react-router'],
          // 状态管理
          'vendor-zustand': ['zustand'],
          // UI 组件库
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
            '@radix-ui/react-switch',
          ],
          // 图表库
          'vendor-recharts': ['recharts'],
          // 地图库
          'vendor-leaflet': ['leaflet'],
          // 动画库
          'vendor-motion': ['motion'],
          // Markdown 渲染
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
          // 日期处理
          'vendor-date': ['date-fns'],
          // 表格
          'vendor-table': ['@tanstack/react-table'],
          // 表单
          'vendor-form': ['react-hook-form', 'zod'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router',
      'zustand',
      'sonner',
      'lucide-react',
      'clsx',
      'tailwind-merge',
    ],
  },
})
