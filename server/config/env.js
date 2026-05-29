const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];

export const validateEnv = () => {
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
};
