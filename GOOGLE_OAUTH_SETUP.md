# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth for your document application.

## Prerequisites

1. Node.js and npm installed
2. MongoDB installed and running
3. A Google Cloud Platform (GCP) account

## Backend Setup

1. **Set up a Google Cloud Project**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the **Google+ API** and **Google OAuth2 API** in the API Library

2. **Configure OAuth Consent Screen**
   - In the Google Cloud Console, go to **APIs & Services** > **OAuth consent screen**
   - Select **External** user type and click **Create**
   - Fill in the required app information (app name, user support email, developer contact info)
   - Add the following scopes:
     - `email`
     - `profile`
   - Add test users (optional for testing)
   - Save and continue

3. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - Select **Web application** as the application type
   - Add the following authorized redirect URIs:
     - `http://localhost:5000/auth/google/callback`
   - Click **Create**
   - Note down the **Client ID** and **Client Secret**

4. **Update Environment Variables**
   - Open `.env` file in the `server` directory
   - Replace the following placeholders with your actual values:
     ```
     GOOGLE_CLIENT_ID=your_google_client_id
     GOOGLE_CLIENT_SECRET=your_google_client_secret
     SESSION_SECRET=generate_a_strong_secret_here
     ```

## Frontend Setup

1. **Install Required Dependencies**
   In the `client` directory, install the required packages:
   ```bash
   cd client
   npm install react-icons
   ```

2. **Environment Variables**
   Create a `.env` file in the `client` directory with:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

## Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Start the frontend**
   ```bash
   cd ../client
   npm install
   npm start
   ```

## Testing the Google Login

1. Open your application in a browser (typically `http://localhost:3000`)
2. Click the "Continue with Google" button
3. You should be redirected to Google's sign-in page
4. After successful authentication, you'll be redirected back to your application

## Troubleshooting

- **Redirect URI mismatch**: Ensure the redirect URI in your Google Cloud Console matches exactly with what's in your code
- **CORS issues**: Make sure your backend has the correct CORS configuration
- **Session not persisting**: Ensure `credentials: 'include'` is set in your fetch requests
- **Invalid credentials**: Double-check your Google OAuth client ID and secret

## Security Notes

- Never commit your `.env` files to version control
- Use HTTPS in production
- Keep your Google OAuth credentials secure
- Set appropriate session expiration times
- Implement CSRF protection for sensitive operations

## Next Steps

- [ ] Add error handling for failed logins
- [ ] Implement refresh tokens
- [ ] Add user profile management
- [ ] Set up proper logging
- [ ] Add rate limiting to prevent abuse
