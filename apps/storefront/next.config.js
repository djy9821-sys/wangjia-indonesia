const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

// Product photos come from the backend (1200 px catalogue files in its /static folder); Next
// sends each card and gallery a WebP copy at the size it shows, so a phone listing loads about
// a third of the bytes. The backend's host comes from the variable the shop already uses.
const backend = new URL(
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
)
const backendIsLocal = ["localhost", "127.0.0.1"].includes(backend.hostname)

// The browse-only copy for GitHub Pages (scripts/build-preview.mjs, src/lib/util/preview.ts):
// built under the repository's path into its own folder, with pictures from files made ahead,
// because a static host has no image service.
const preview = process.env.NEXT_PUBLIC_WJ_PREVIEW === "1"

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  ...(preview
    ? { basePath: process.env.NEXT_PUBLIC_BASE_PATH || "", distDir: ".next-preview" }
    : {}),
  agentRules: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Link", value: '</.well-known/ucp>; rel="ucp"' }],
      },
      {
        source: "/:countryCode/products/:handle",
        headers: [{ key: "Vary", value: "Accept" }],
      },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/:countryCode/products/:handle([^/.]+).md",
          destination: "/:countryCode/products/:handle/markdown",
        },
        {
          source: "/:countryCode/products/:handle([^/.]+)",
          has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }],
          destination: "/:countryCode/products/:handle/markdown",
        },
      ],
    }
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    qualities: [50, 75],
    ...(preview
      ? { loader: "custom", loaderFile: "./src/lib/preview-image-loader.js" }
      : {}),
    // on a developer's machine the backend is localhost, which Next 16 refuses unless told
    dangerouslyAllowLocalIP: backendIsLocal,
    remotePatterns: [
      {
        protocol: backend.protocol.replace(":", ""),
        hostname: backend.hostname,
        ...(backend.port ? { port: backend.port } : {}),
        pathname: "/static/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
    ],
  },
}

module.exports = nextConfig
