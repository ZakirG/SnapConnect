# Phase 2: MVP - Authentication & Camera

## Goal
Implement the core features required for a minimal viable product: user authentication (signup and login) and camera functionality. By the end of this phase, users will be able to create an account, log in, and capture a photo.

## Deliverables
- A fully functional user authentication flow using Firebase.
- A protected camera screen accessible only to authenticated users.
- The ability to capture a photo and view it on a preview screen.
- A global state management system for user authentication status.

---

## Features & Tasks

### 1. **Firebase Backend Integration**
- **Description**: Configure the Firebase project and integrate the necessary services into the application.
- **Steps**:
    1. Create a new project in the Firebase console.
    2. Enable Firebase Authentication (Email/Password and Phone providers).
    3. Enable Firestore for user data storage and Cloud Storage for media files.
    4. Create a `config.ts` file in `src/services/firebase/` and add the Firebase project configuration keys.
    5. Initialize the Firebase app within the application's entry point.

### 2. **Implement User Authentication Screens**
- **Description**: Build the UI and logic for the Signup and Login screens.
- **UI References**: `signup-view.jpeg`, `login-view.jpeg`, `home-unauthenticated.jpeg`.
- **Steps**:
    1. Build the `SignupScreen` UI with input fields for email/phone, username, and password, using the neumorphic components from Phase 1.
    2. Implement the `handleSignup` function using Firebase Authentication's `createUserWithEmailAndPassword` or phone auth methods.
    3. Build the `LoginScreen` UI with fields for credentials.
    4. Implement the `handleLogin` function using `signInWithEmailAndPassword`.
    5. Store user data (e.g., username) in a `users` collection in Firestore upon successful registration.

### 3. **Manage Authentication State**
- **Description**: Use Zustand to manage and persist the user's authentication state globally.
- **Steps**:
    1. Create a `userStore` with Zustand to hold the user object and authentication status (e.g., `isLoggedIn`).
    2. Update the store upon successful login and clear it on logout.
    3. Subscribe to Firebase's `onAuthStateChanged` listener to automatically update the Zustand store.
    4. Modify the root navigator to conditionally render the `Auth` stack or the `Main` app stack based on the `isLoggedIn` state.
    5. Implement a basic "Logout" button in a temporary location (e.g., a profile screen placeholder).

### 4. **Implement Camera Screen**
- **Description**: Build the main camera interface for taking photos.
- **UI Reference**: `camera-view.jpeg`.
- **Steps**:
    1. Create the `CameraScreen` component.
    2. Use the `expo-camera` library to display a full-screen live camera preview.
    3. Implement logic to request camera and microphone permissions from the user upon screen load.
    4. Add neumorphic UI controls to switch between the front and rear cameras.
    5. Add a neumorphic capture button to take a photo.

### 5. **Implement Snap Preview**
- **Description**: Create a screen to display the captured photo, with an option to discard it.
- **Steps**:
    1. Upon photo capture, navigate to a new `SnapPreviewScreen`.
    2. Pass the URI of the captured image as a navigation parameter.
    3. Display the captured photo full-screen on this new screen.
    4. Add a "Discard" or "Back" button that navigates the user back to the `CameraScreen`.
    5. The "Send To" functionality is deferred to the next phase. 