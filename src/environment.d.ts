declare namespace NodeJS {
  interface ProcessEnv {
    readonly AWS_API_GATEWAY_URL: string;
    readonly AWS_API_KEY: string;
  }
}
