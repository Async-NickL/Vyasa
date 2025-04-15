# Vyasa Frontend

This is the frontend for the Vyasa educational platform, built with React and Vite.

## Setup and Configuration

### API Configuration

This project requires connecting to the Vyasa backend API. The API configuration is stored in `src/config/api.js`, which is excluded from Git to allow different configurations for development and production environments.

To set up your API configuration:

1. Copy the example file:
   ```
   cp src/config/api.example.js src/config/api.js
   ```

2. Edit `src/config/api.js` to set the appropriate base URL:
   - For local development: `http://localhost:5000`
   - For production: `https://your-deployed-backend.onrender.com`

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```

## Deployment

When deploying to Netlify or other hosting platforms, make sure to:

1. Configure the API settings in `src/config/api.js` before building
2. Build the project with `npm run build`
3. Deploy the contents of the `dist` directory

## Features

- YouTube Video Summarization
- Document Analysis
- Learning Roadmap Generation
- Question Bank Generation
- Visual Explanations
