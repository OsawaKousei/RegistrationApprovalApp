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
      "process.env.DISCORD_BOT_TOKEN": JSON.stringify(
        process.env.DISCORD_BOT_TOKEN
      ),
      "process.env.DISCORD_CHANNEL_ID": JSON.stringify(
        process.env.DISCORD_CHANNEL_ID
      ),
    },
  })
  .catch((error) => {
    console.log("ビルドに失敗しました");
    console.error(error);
    process.exit(1);
  });
