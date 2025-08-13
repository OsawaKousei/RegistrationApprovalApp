declare namespace NodeJS {
  interface ProcessEnv {
    readonly DISCORD_WEBHOOK_URL: string;
    readonly DISCORD_BOT_TOKEN: string;
    readonly DISCORD_CHANNEL_ID: string;
  }
}
