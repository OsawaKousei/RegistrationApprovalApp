import esbuild from "esbuild";
import { GasPlugin } from "esbuild-gas-plugin";
import dotenv from "dotenv";

dotenv.config();

esbuild
  .build({
    entryPoints: ["./src/main.ts"],
    bundle: true,
    minify: true,
    outfile: "./dist/main.js",
    plugins: [GasPlugin],
    define: {
      "process.env.AWS_API_GATEWAY_URL": JSON.stringify(
        process.env.AWS_API_GATEWAY_URL
      ),
      "process.env.AWS_API_KEY": JSON.stringify(process.env.AWS_API_KEY),
    },
  })
  .catch((error) => {
    console.log("ビルドに失敗しました");
    console.error(error);
    process.exit(1);
  });
