# SnapConnect 📸

A modern ephemeral messaging platform built with React Native, featuring neumorphic design and real-time communication. SnapConnect delivers the core Snapchat experience with a unique tactile interface design.

## 🚀 Features

### Core Functionality
- **Ephemeral Messaging**: Disappearing photos, videos, and messages
- **Real-time Communication**: Instant message delivery and synchronization
- **Stories**: 24-hour ephemeral content sharing
- **Camera Integration**: Photo/video capture with AR filters
- **Friend Management**: Add and manage connections
- **Group Chats**: Multi-participant conversations

### Design Philosophy
- **Neumorphic UI**: Soft, tactile interfaces with subtle shadows and highlights
- **Mobile-First**: Optimized for touch interactions and mobile devices
- **Ephemeral Nature**: Content disappears after viewing or time expiration
- **Real-time Performance**: Instant synchronization across devices

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo SDK 53** - Development platform and tools
- **NativeWind** - Tailwind CSS for React Native styling
- **Zustand** - Lightweight state management

### Backend & Services
- **Firebase Authentication** - User authentication and security
- **Firebase Firestore** - NoSQL database for user data
- **Firebase Storage** - Media file storage and management
- **Firebase Realtime Database** - Real-time messaging and synchronization
- **Expo Push Notifications** - Real-time notifications

### Key Libraries
- `expo-camera` - Camera functionality and permissions
- `react-native-gesture-handler` - Touch interactions and gestures
- `react-native-reanimated` - Smooth animations and AR effects
- `expo-contacts` - Contact integration and friend discovery

## 📱 User Experience

### Authentication Flow
1. **Sign Up**: Create account with email/phone verification
2. **Log In**: Secure authentication with optional 2FA
3. **Permissions**: Grant camera, microphone, and contacts access
4. **Profile Setup**: Customize username and avatar

### Core User Journey
1. **Camera Screen**: Main hub for content creation
2. **Snap Creation**: Capture photos/videos with AR filters
3. **Content Editing**: Add text, drawings, stickers, and effects
4. **Sharing**: Send to friends, groups, or post to Stories
5. **Chat & Stories**: Real-time messaging and ephemeral content

## 🎨 Design System

### Neumorphic Principles
- **Depth Through Light**: Subtle shadows and highlights create tactile feel
- **Soft Edges**: Rounded corners and organic shapes
- **Tactile Feedback**: Visual feedback for all interactions
- **Consistent Shadows**: Uniform shadow values across components

### Color Palette
- **Primary Background**: Soft neutral gray (#f0f0f3)
- **Secondary Background**: Slightly darker gray (#e6e6e9)
- **Light Shadows**: White with low opacity (rgba(255,255,255,0.7))
- **Dark Shadows**: Soft gray with low opacity (rgba(0,0,0,0.1))

### Component Guidelines
- **Buttons**: Neumorphic styling with outset/inset shadows
- **Cards**: Elevated containers with subtle shadows
- **Input Fields**: Inset styling to appear "pressed in"
- **Navigation**: Consistent elevation and active states

## 🏗️ Project Structure

```
SnapConnect/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components
│   │   ├── neumorphic/     # Neumorphic design components
│   │   ├── camera/         # Camera-related components
│   │   ├── chat/           # Chat interface components
│   │   └── stories/        # Stories components
│   ├── screens/            # Screen components
│   │   ├── auth/           # Authentication screens
│   │   ├── camera/         # Camera and editing screens
│   │   ├── chat/           # Chat and messaging screens
│   │   └── social/         # Stories and social screens
│   ├── services/           # API and external services
│   │   ├── firebase/       # Firebase integrations
│   │   └── api/            # API services
│   ├── hooks/              # Custom React hooks
│   ├── store/              # Zustand state management
│   ├── utils/              # Utility functions
│   ├── styles/             # Design system and styling
│   └── types/              # TypeScript definitions
├── assets/                 # Images, icons, and static assets
├── _docs/                  # Project documentation
│   └── phases/             # Development phase documentation
└── ui-references/          # Design reference images
```

## 🚀 Getting Started

Follow these steps to get a local development environment running in minutes.

### Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** (v9 or higher) – comes with Node, or use **yarn pnpm** if you prefer
3. **Expo CLI** – if you don't have it globally:

   ```bash
   npm install -g expo-cli   # optional – we use npx in the commands below
   ```

4. A device or emulator:

   • iOS – Xcode + Simulator (macOS) or Expo Go on your iPhone
   • Android – Android Studio + Emulator or Expo Go on your Android phone

### Install & Run

```bash
# 1. Clone the repo
git clone https://github.com/your-org/snapconnect.git
cd SnapConnect

# 2. Install JavaScript dependencies
npm install       # or: yarn install / pnpm install

# 3. Install iOS/Android native deps (only if you plan to run a native build)
#    npx expo prebuild        # optional – not required for Expo Go

# 4. Start the Metro bundler, clearing any previous cache
npx expo start --clear

# 5. Open the project
#    • Press "i" to launch iOS Simulator
#    • Press "a" to launch Android emulator
#    • Or scan the QR code with Expo Go on your device
```

That's it — Metro will compile and serve the app. Changes you make in the code will hot-reload automatically.

### Environment Variables

Create a `.env` (or copy `.env.example`) in the project root and fill in the following keys:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

> NOTE: We switched from Firebase to Supabase. The old Firebase section has been removed.

## 📋 Development Phases

The project follows an iterative development approach with four phases:

1. **Phase 1: Setup** - Foundation and UI/UX (2-3 weeks)
2. **Phase 2: MVP** - Core authentication and camera (3-4 weeks)
3. **Phase 3: Enhanced** - Real-time messaging and Stories (4-5 weeks)
4. **Phase 4: Polished** - Advanced features and optimization (5-6 weeks)

See `_docs/phases/` for detailed phase documentation.

## 🧪 Testing

### Testing Strategy
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: Firebase and API integration testing
- **E2E Tests**: User flow testing with Detox
- **Performance Tests**: App performance and Firebase usage monitoring

### Running Tests
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance
```

## 📦 Deployment

### Development
- Expo Go for rapid development and testing
- Firebase development project
- Local development with hot reloading

### Staging
- EAS Build for testing on physical devices
- Firebase staging project
- Beta testing with limited users

### Production
- App Store and Google Play deployment
- Firebase production project
- Monitoring and analytics implementation

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### Firebase Security Rules
Ensure proper security rules are configured for:
- User authentication and authorization
- Data access permissions
- Media file upload restrictions
- Real-time database access control

## 🤝 Contributing

### Development Guidelines
1. Follow the neumorphic design principles
2. Maintain consistent code style and structure
3. Write comprehensive tests for new features
4. Document API changes and new components
5. Follow the established folder structure

### Code Style
- Use TypeScript for type safety
- Follow React Native best practices
- Implement proper error handling
- Use meaningful variable and function names
- Add comments for complex logic

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Expo** for the development platform
- **Firebase** for backend services
- **React Native** community for tools and libraries
- **Neumorphic Design** community for design inspiration

## 📞 Support

For questions, issues, or contributions:
- Create an issue in the repository
- Review the documentation in `_docs/`
- Check the development phase guides

---

**SnapConnect** - Where ephemeral moments meet tactile design ✨ 