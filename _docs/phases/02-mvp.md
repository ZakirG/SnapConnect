# Phase 2: MVP - Core Authentication & Camera

## Overview
Build a minimal viable product with working authentication and basic camera functionality. Users can sign up, log in, and take photos with basic editing capabilities. This phase delivers the essential SnapConnect experience.

## Deliverables
- Functional user authentication (signup/login)
- Working camera with photo capture
- Basic Snap editing (text, filters)
- User profile management
- Basic friend system

## Features & Tasks

### 1. Firebase Authentication Integration
**Goal**: Implement complete authentication flow with Firebase

**Steps**:
1. Configure Firebase project and add credentials
2. Implement email/password authentication
3. Add phone number authentication with SMS verification
4. Create user profile creation flow
5. Implement authentication state management with Zustand

### 2. User Profile & Data Management
**Goal**: Store and manage user data in Firebase

**Steps**:
1. Set up Firebase Firestore for user profiles
2. Create user profile schema (username, displayName, avatar)
3. Implement profile editing functionality
4. Add avatar upload to Firebase Storage
5. Create user search functionality

### 3. Enhanced Camera Functionality
**Goal**: Implement full camera features with photo capture

**Steps**:
1. Add photo capture with proper permissions
2. Implement camera switching (front/rear)
3. Add flash control functionality
4. Create photo preview screen
5. Implement basic photo saving to device

### 4. Snap Creation & Editing
**Goal**: Allow users to create and edit Snaps with basic features

**Steps**:
1. Create Snap editing interface with neumorphic controls
2. Implement text overlay functionality
3. Add basic filter effects (brightness, contrast, saturation)
4. Create drawing tool with touch gestures
5. Implement Snap preview and confirmation

### 5. Basic Friend System
**Goal**: Enable users to add and manage friends

**Steps**:
1. Create friend request system in Firestore
2. Implement username search functionality
3. Add friend request notifications
4. Create friends list management
5. Implement basic friend profile viewing

## Technical Requirements

### Additional Dependencies
```json
{
  "expo-image-picker": "^14.0.0",
  "expo-media-library": "^15.0.0",
  "react-native-gesture-handler": "^2.0.0",
  "react-native-view-shot": "^3.0.0",
  "expo-contacts": "^12.0.0",
  "expo-notifications": "^0.20.0"
}
```

### Firebase Configuration
```typescript
// Firebase setup for authentication and storage
const firebaseConfig = {
  // Firebase project configuration
};

// Firestore collections
- users/{userId}
- friends/{userId}/friends/{friendId}
- friendRequests/{requestId}
- snaps/{snapId}
```

### Enhanced File Structure
```
src/
├── services/
│   ├── firebase/
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   └── storage.ts
│   └── api/
│       ├── userApi.ts
│       └── friendApi.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useCamera.ts
│   └── useFriends.ts
├── components/
│   ├── camera/
│   │   ├── CameraControls.tsx
│   │   └── SnapEditor.tsx
│   └── friends/
│       ├── FriendList.tsx
│       └── FriendRequest.tsx
└── utils/
    ├── permissions.ts
    └── imageProcessing.ts
```

## Success Criteria
- [ ] Users can sign up and log in successfully
- [ ] Camera captures photos with proper permissions
- [ ] Snap editing works with text and basic filters
- [ ] Friend system allows adding and viewing friends
- [ ] User profiles are properly stored and managed
- [ ] App maintains neumorphic design consistency

## User Flow Validation
- [ ] New user can complete signup flow
- [ ] Existing user can log in and access camera
- [ ] User can take photo, edit it, and save
- [ ] User can search and add friends
- [ ] Profile information is editable and persistent

## Next Phase Dependencies
This MVP phase enables:
- Phase 3: Enhanced - Real-time messaging and Stories
- Phase 4: Polished - Advanced features and optimizations

## Notes
- Focus on core functionality over advanced features
- Ensure proper error handling for authentication flows
- Test camera functionality on physical devices
- Implement proper data validation and security rules
- Maintain performance with Firebase operations 