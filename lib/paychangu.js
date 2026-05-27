export const paychanguAccounts = {
  main: {
    publicKey:
      process.env.NEXT_PUBLIC_PAYCHANGU_PUBLIC_KEY_MAIN,

    secretKey:
      process.env.PAYCHANGU_SECRET_KEY_MAIN,
  },

  youth: {
    publicKey:
      process.env.NEXT_PUBLIC_PAYCHANGU_PUBLIC_KEY_YOUTH,

    secretKey:
      process.env.PAYCHANGU_SECRET_KEY_YOUTH,
  },
};
