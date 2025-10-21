# 劇団はたらきばち公式サイト
ローカル環境開発時-起動時コマンド <br/>
npx wrangler pages dev --local --proxy 5173 -- npm run dev <br/>
※wrangler pages dev --local --proxy 5173 -- npm run dev を実行すると、Cloudflare Pages の開発サーバ（Functions）と Vite の開発サーバ（HMR）を一度に起動し、Wrangler が Vite のポートをリバースプロキシします。その結果、フロントの HMR と Functions のホットリロードが同時に動作し、開発体験（DX）が大幅に向上します。

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration 

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
