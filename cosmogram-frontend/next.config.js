/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@puppeteer/browsers'],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.ts$/,
      include: /node_modules\/@puppeteer/,
      use: {
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          compilerOptions: {
            module: 'esnext',
            target: 'esnext',
            skipLibCheck: true
          }
        }
      }
    });
    return config;
  }
}

module.exports = nextConfig;
