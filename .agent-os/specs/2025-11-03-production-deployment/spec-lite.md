# Spec Summary (Lite)

Establish a fully automated CI/CD pipeline to deploy the Adaptive Training Plan monorepo to production environments. Frontend (Next.js) deploys to Vercel, backend (Express.js) deploys to Fly.io, both connecting to MongoDB Atlas. Deployments trigger automatically on every push to main branch with Turborepo build optimization and proper environment variable configuration across all platforms.
