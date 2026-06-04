export type Config = {
  PAYMONGO_SECRET_KEY?: string;
  BASE_URL: string;
};

export const readConfig = (): Config => {
  return {
    PAYMONGO_SECRET_KEY: process.env.PAYMONGO_SECRET_KEY,
    BASE_URL: process.env.BASE_URL || "[localhost](http://localhost:3000)"
  };
};
