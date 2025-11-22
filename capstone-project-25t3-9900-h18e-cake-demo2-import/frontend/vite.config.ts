// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// export default defineConfig({
//   base: './',
//   plugins: [react()],
//   server: {
//     port: 5173,
//     host: true, // 允许外部访问
//     open: true  // 自动打开浏览器
//   },
//   build: {
//     outDir: 'dist',
//     assetsDir: 'assets',
//     sourcemap: true,
//     // 优化chunk分割
//     rollupOptions: {
//       output: {
//         manualChunks: {
//           vendor: ['react', 'react-dom']
//         }
//       }
//     }
//   },
//   // 确保public文件夹正确复制
//   publicDir: 'public'
// })

export default defineConfig({
  plugins: [react()],
  base: '/ls/',  // ★ 关键：仓库名
})
