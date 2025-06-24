# Phase 4: Polished - Advanced Features & Optimization

## Goal
Refine the application by adding advanced, feature-rich functionality, polishing the user interface, and optimizing for performance and scalability. This phase will elevate the app from a functional product to a polished, engaging experience.

## Deliverables
- Video capture, sending, and story posting capabilities.
- Basic Snap editing tools (drawing and text).
- Simple, proof-of-concept AR filters on the camera screen.
- Group chat functionality.
- Push notifications for key social events.

---

## Features & Tasks

### 1. **Implement Video Snaps**
- **Description**: Extend the camera and messaging systems to support short-form video.
- **Steps**:
    1. Update the `CameraScreen` to handle video recording (e.g., press-and-hold the capture button).
    2. Use `expo-camera`'s `recordAsync` function to capture video and `stopRecording` to finish.
    3. Modify the `SnapPreviewScreen` to play video files.
    4. Update the backend logic to handle video uploads to Firebase Storage and update metadata accordingly.
    5. Ensure videos can be sent in chats and posted to Stories just like photos.

### 2. **Develop Snap Editing Tools**
- **Description**: Provide users with basic creative tools to decorate their Snaps.
- **Steps**:
    1. On the `SnapPreviewScreen`, add a button to open an editing toolbar.
    2. Implement a drawing tool using a canvas overlay (e.g., with `react-native-svg` or `react-native-skia`).
    3. Implement a text tool that allows users to add and position captions on the Snap.
    4. Use a library like `react-native-view-shot` to capture the edited view, flattening the decorations onto the image/video frame before sending.

### 3. **Introduce Basic AR Filters**
- **Description**: Add simple, face-tracking augmented reality filters to the camera.
- **Steps**:
    1. Configure the `FaceDetector` available in `expo-camera` to detect facial landmarks.
    2. Create a small set of simple AR assets (e.g., image files for glasses, hats, or animal ears).
    3. Use the coordinates from the face detector to overlay these assets onto the camera view in real-time.
    4. Implement a simple UI, such as a horizontal swipe gesture on the camera screen, to cycle through the available filters.
    5. This serves as a proof-of-concept for more advanced AR features.

### 4. **Implement Group Chat**
- **Description**: Extend the real-time chat functionality to support conversations with multiple participants.
- **Steps**:
    1. Update the Firebase data model to support group conversations, including a list of members and group metadata (e.g., group name).
    2. Create a UI flow for creating new groups from the user's friend list.
    3. Modify the `ConversationScreen` to handle multiple recipients and display messages from different senders within the group.
    4. Ensure Snaps can be sent to groups, where they are viewable once by each member.
    5. Adapt the ephemeral logic for group messages and Snaps.

### 5. **Integrate Push Notifications**
- **Description**: Implement push notifications to keep users engaged.
- **Steps**:
    1. Integrate `expo-push-notifications` and configure the service.
    2. Prompt users for notification permissions after signup.
    3. Store the user's Expo Push Token in their Firestore document.
    4. Set up Firebase Cloud Functions to trigger notifications for key events:
        - Receiving a new Snap or chat message.
        - Receiving a new friend request.
        - When a friend posts a Story (optional, to avoid excessive notifications).
    5. Ensure notifications deep-link the user to the relevant screen within the app (e.g., a specific chat). 