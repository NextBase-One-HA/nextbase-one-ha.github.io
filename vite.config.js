/** 事務長ステラ確認用: npx vite --host で同一LANのiPhoneからアクセス可能 */
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: { host: true, port: 5173 }
});
