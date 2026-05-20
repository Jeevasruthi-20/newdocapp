# MedConnect - Comprehensive Authentication System

## 🚀 Features

### 🔐 Authentication Methods

#### 1. Email & Password Authentication
- **Sign Up**: Create account with email, password, name, phone, and date of birth
- **Sign In**: Login with existing credentials
- **Password Reset**: Forgot password functionality with email reset
- **Email Verification**: Automatic email verification on signup

#### 2. Social Authentication
- **Google Sign-In**: One-click Google authentication
- **Facebook Sign-In**: Facebook OAuth integration
- **Apple Sign-In**: Apple ID authentication support

#### 3. Phone Authentication
- **Phone Number Login**: Login using phone number + OTP
- **OTP Verification**: 6-digit verification code
- **Resend OTP**: Automatic countdown timer with resend functionality
- **Phone Validation**: International phone number formatting and validation

### 🎨 User Experience Features

#### Enhanced UI/UX
- **Tabbed Interface**: Switch between email and phone authentication
- **Real-time Validation**: Instant form validation and error messages
- **Loading States**: Smooth loading animations and disabled states
- **Responsive Design**: Mobile-first design with touch-friendly interactions
- **Error Handling**: User-friendly error messages with specific guidance

#### User Management
- **User Profile**: Complete user profile management
- **Avatar Support**: Profile picture upload and display
- **Verification Status**: Email verification status indicators
- **Session Management**: Automatic session handling and logout

### 🛡️ Security Features

#### Firebase Security
- **Recaptcha Integration**: Invisible reCAPTCHA for phone authentication
- **Rate Limiting**: Built-in Firebase rate limiting protection
- **Secure OAuth**: Industry-standard OAuth 2.0 implementation
- **Token Management**: Automatic token refresh and validation

#### Data Protection
- **Input Sanitization**: All user inputs are validated and sanitized
- **Secure Storage**: Firebase secure token storage
- **HTTPS Only**: All communications use secure protocols

## 🏗️ Architecture

### Frontend Structure
```
src/
├── components/
│   ├── Navbar.jsx          # Enhanced navigation with user menu
│   ├── ProtectedRoute.js   # Route protection component
│   └── ...
├── context/
│   └── AuthContext.js      # Authentication state management
├── pages/
│   ├── Login.jsx           # Enhanced login with multiple methods
│   ├── Signup.jsx          # Enhanced signup with social options
│   └── ...
└── firebaseConfig.js       # Firebase configuration with providers
```

### Authentication Flow
1. **User Registration**: Multiple signup options (email/password, social)
2. **User Login**: Multiple login methods with fallback options
3. **Session Management**: Automatic session handling and persistence
4. **Route Protection**: Protected routes with authentication checks
5. **User Profile**: Complete profile management and updates

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- Firebase project with Authentication enabled
- Google, Facebook, and Apple OAuth apps configured

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd doc-app/client
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**
   - Create a Firebase project
   - Enable Authentication with Email/Password, Google, Facebook, and Apple
   - Update `src/firebaseConfig.js` with your Firebase config

4. **Configure OAuth Providers**

#### Google OAuth
- Go to Google Cloud Console
- Create OAuth 2.0 credentials
- Add authorized origins and redirect URIs

#### Facebook OAuth
- Go to Facebook Developers
- Create a Facebook App
- Configure OAuth settings

#### Apple OAuth
- Go to Apple Developer Console
- Create App ID and Service ID
- Configure Sign in with Apple

5. **Start the development server**
```bash
npm start
```

## 📱 Usage Examples

### Basic Authentication
```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { currentUser, isAuthenticated, logout } = useAuth();
  
  if (isAuthenticated()) {
    return (
      <div>
        <p>Welcome, {currentUser.displayName}!</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }
  
  return <p>Please log in</p>;
}
```

### Protected Routes
```jsx
import ProtectedRoute from '../components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/profile" element={
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute requireVerification={true}>
          <AdminPanel />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
```

### User Profile Management
```jsx
import { useAuth } from '../context/AuthContext';

function ProfileEditor() {
  const { updateUserProfile, getDisplayName, getEmail } = useAuth();
  
  const handleUpdate = async (updates) => {
    try {
      await updateUserProfile(updates);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Update failed: ' + error.message);
    }
  };
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleUpdate({ displayName: 'New Name' });
    }}>
      <input defaultValue={getDisplayName()} />
      <button type="submit">Update</button>
    </form>
  );
}
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the client directory:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### Firebase Authentication Settings
1. **Enable Authentication Methods**:
   - Email/Password
   - Google
   - Facebook
   - Apple
   - Phone

2. **Configure OAuth Redirects**:
   - Add your domain to authorized origins
   - Configure redirect URIs for each provider

3. **Phone Authentication**:
   - Enable phone number sign-in
   - Configure reCAPTCHA settings

## 🎯 Customization

### Styling
- All components use CSS modules for styling
- Customizable color schemes via CSS variables
- Responsive design with mobile-first approach
- Dark/light theme support ready

### Adding New Providers
1. **Update Firebase Config**:
```jsx
import { OAuthProvider } from 'firebase/auth';

const newProvider = new OAuthProvider('provider.com');
export { newProvider };
```

2. **Add Provider to Components**:
```jsx
const handleNewProviderLogin = async () => {
  try {
    await signInWithPopup(auth, newProvider);
    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

## 🐛 Troubleshooting

### Common Issues

#### OAuth Popup Blocked
- Ensure popup blockers are disabled
- Check if the domain is authorized in OAuth settings
- Verify redirect URIs are correctly configured

#### Phone Authentication Fails
- Check reCAPTCHA configuration
- Verify phone number format (must include country code)
- Ensure Firebase phone auth is enabled

#### Social Login Errors
- Verify OAuth app configurations
- Check domain authorization
- Ensure redirect URIs match exactly

### Debug Mode
Enable debug logging:
```jsx
// In firebaseConfig.js
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase config:', firebaseConfig);
}
```

## 📚 API Reference

### AuthContext Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `isAuthenticated()` | Check if user is logged in | `boolean` |
| `getDisplayName()` | Get user's display name | `string` |
| `getEmail()` | Get user's email | `string` |
| `getPhotoURL()` | Get user's profile picture | `string` |
| `isEmailVerified()` | Check email verification status | `boolean` |
| `logout()` | Sign out current user | `Promise<void>` |
| `updateUserProfile(updates)` | Update user profile | `Promise<Object>` |
| `resetPassword(email)` | Send password reset email | `Promise<Object>` |

### Firebase Auth Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `signInWithEmailAndPassword` | Email/password login | `auth, email, password` |
| `signInWithPopup` | Social login popup | `auth, provider` |
| `signInWithPhoneNumber` | Phone number login | `auth, phone, appVerifier` |
| `createUserWithEmailAndPassword` | Create new account | `auth, email, password` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the Firebase documentation
- Review the troubleshooting section above

---

**Built with ❤️ using React, Firebase, and modern web technologies**
