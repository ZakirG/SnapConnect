# Phase 3: Enhanced - Real-time Messaging & Stories

## Goal
Expand on the MVP by building the core social and communication features. This phase focuses on enabling users to connect with friends, send Snaps, engage in real-time chat, and share ephemeral content through Stories.

## Deliverables
- A friend management system (search, add, view friends).
- The ability to send a captured photo (a "Snap") to one or more friends.
- A real-time, one-on-one chat interface.
- A functional Stories feature where users can post Snaps that last for 24 hours.

---

## Features & Tasks

### 1. **Friend Management System**
- **Description**: Implement the functionality for users to find and connect with each other.
- **Steps**:
    1. Create a `friends` sub-collection in Firestore for each user to store their list of friend UIDs.
    2. Build a search interface that allows users to look up other users by their unique username.
    3. Implement a friend request system: sending, receiving, accepting, and denying requests.
    4. Create a "Friends" screen where users can view their list of accepted friends.
    5. Optionally, integrate `expo-contacts` to suggest friends from the user's device contacts.

### 2. **Implement Snap Sending Logic**
- **Description**: Allow users to send their captured photos to friends.
- **Steps**:
    1. Create a "Send To" screen that appears after the `SnapPreviewScreen`.
    2. This screen will display the user's friend list, allowing them to select one or more recipients.
    3. On send, upload the Snap image to a dedicated folder in Firebase Storage.
    4. Create a record in Firebase Realtime Database or Firestore that contains the Snap's metadata (sender ID, recipient IDs, storage URL, timestamp).
    5. Ensure sent Snaps are marked for deletion after being viewed.

### 3. **Build Real-Time Chat**
- **Description**: Create a one-on-one messaging interface with ephemeral messages.
- **UI Reference**: `home-authenticated.jpeg`.
- **Steps**:
    1. Design a `ChatScreen` that lists all active conversations, showing the friend's name and the last message.
    2. Create a `ConversationScreen` for individual chats using Firebase Realtime Database for low-latency message exchange.
    3. Implement logic to send and receive text messages in real-time.
    4. Implement the "ephemeral" nature: messages should be deleted from the database after they are read by the recipient or after 24 hours.
    5. Users should be able to send Snaps directly within the chat interface.

### 4. **Implement Stories Creation**
- **Description**: Allow users to post a Snap to their "Story," where it is visible to all their friends for 24 hours.
- **Steps**:
    1. Add an "Add to My Story" option on the "Send To" screen.
    2. When a user posts to their Story, upload the Snap to a `/stories` path in Firebase Storage.
    3. Store the Story's metadata (user ID, storage URL, timestamp) in a dedicated `stories` collection in Firestore.
    4. Implement a Cloud Function or client-side logic to automatically delete Story documents and their corresponding files from Storage after 24 hours.

### 5. **Build Stories Viewing Experience**
- **Description**: Create the interface for users to view their friends' Stories.
- **UI Reference**: `home-authenticated.jpeg` (for Story circles).
- **Steps**:
    1. Create a dedicated `StoriesScreen` or integrate a Stories rail into an existing screen.
    2. Fetch the active stories from all of the current user's friends.
    3. Display the stories as a list of circular, tappable profile icons.
    4. Tapping a user's icon opens a full-screen, auto-advancing viewer that plays their story Snaps in chronological order.
    5. Implement UI indicators to show which stories have already been viewed. 