import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ["@wulam/goetsusioji"],
  serverExternalPackages: ["opencc-js"],
  outputFileTracingRoot: path.join(rootDir, "../.."),
};

export default nextConfig;
