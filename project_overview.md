We are building a Snapchat clone called SnapConnect.

It will be a complete ephemeral messaging platform with essential features:
- Real-time photo/video sharing with disappearing messages
- Simple AR filters and camera effects
- User authentication and friend management
- Stories and group messaging functionality
- Core social features matching Snapchat's core experience

The tech stack is React Native, Expo, Firebase auth + storage, NativeWind/Tailwind CSS for responsive design, Zustand for state management, and a Firetime Realtime Database for any real-time features. We'll be using Expo Go SDK 53.

For each of these features below, please explain to me in a simple way how we will implement them with the provided tech stack. Ideally, we would use existing libraries or packages or github repositories compatible with SDK 53 to implement features so as to save time.


## 📲 SnapConnect User Flow

### 1. **App Launch: Authentication Gate**

When a user opens SnapConnect and is **not logged in**, they encounter a gate:

* **Option 1: Log In**

  * User enters phone number or email + password.
  * May be prompted for 2FA (via SMS or app).
  * Successful login takes them to the Camera screen.

* **Option 2: Sign Up**

  * User provides name, birthday, phone number or email.
  * Creates a username and password.
  * May verify via SMS or email.
  * After verification, they're taken to the Camera screen.
  * Prompted to allow access to **camera**, **microphone**, and **contacts**.

---

### 2. **Camera Screen (Core Interface)**

The Camera screen is the app’s main hub.

* **Live preview** of the camera (front or rear).
* Swipe or tap to apply **AR filters** (Lenses) and effects.
* Controls:

  * **Tap** to take a photo.
  * **Hold** to record a video.
  * Icons to toggle flash, switch camera, access memories (saved Snaps).

---

### 3. **Create & Share a Snap**

After taking a photo or video:

* User can:

  * Add **text**, **drawings**, **stickers**, or **music**.
  * Swipe to apply additional filters.
* Tapping **“Send To”** reveals:

  * **Friends list** (with search).
  * Option to post to:

    * **My Story** (viewable by all friends).
    * **Group Chats** (shared to group threads).
    * **New Group** (create a group from selected friends).

Snaps sent directly **disappear after viewing** (unless saved by the sender or in chat settings).

---

### 4. **Chat & Group Messaging**

Swipe **left** from the camera to open the **Chat screen**:

* See individual and group threads.
* Tap on a friend or group to:

  * **Send Snaps** (within chat).
  * **Send messages**, voice notes, or initiate a video/audio call.
* Messages and Snaps can be set to **auto-delete** after viewing or after 24 hours.

---

### 5. **Stories View**

Swipe **right** from the camera to access the **Stories screen**:

* View friends’ **Stories** (in chronological bubbles).
* Tap to view; swipe up to reply with a message.
* Users can also post their own Stories or view group stories here.

---

### 6. **Add Friends & Manage Contacts**

From the camera or chat screen:

* Tap the **search icon** or profile icon to:

  * Search for usernames.
  * Scan Snapcodes.
  * Add from contacts.
* Friend requests and new friend suggestions are managed here.
* Users can accept/reject and manage their friend list easily.

---

## 🔁 Summary: Core Flow

1. **Auth**: Log in or sign up.
2. **Camera**: Live view with AR filters → Take Snap.
3. **Edit & Send**: Enhance Snap → Send to friends, groups, or Story.
4. **Chat**: Message threads, disappearing Snaps, and group chats.
5. **Stories**: Watch and post ephemeral content.
6. **Friends**: Add/manage friends through usernames or contacts.


Implementation discussion using the tech stack (React Native + Expo SDK 53 + Firebase + Zustand + NativeWind):

---

### **1. Authentication Gate (Login / Signup)**

**✅ Packages:**

* [`firebase`](https://www.npmjs.com/package/firebase)
* [`react-native-firebase-auth`](https://github.com/invertase/react-native-firebase)
* [`expo-auth-session`](https://docs.expo.dev/guides/authentication/)
* [`react-native-phone-number-input`](https://github.com/lonelycpp/react-native-phone-number-input)

**🛠️ Implementation Steps:**

* Use Firebase Auth for email/password and phone login.
* Add phone auth with reCAPTCHA fallback using Expo's WebView or custom logic.
* Zustand stores `user` state globally.
* Add logic to show Camera screen only if `user != null`.

---

### **2. Camera Screen with AR Filters**

**✅ Packages:**

* [`expo-camera`](https://docs.expo.dev/versions/latest/sdk/camera/)
* [`react-native-vision-camera`](https://github.com/mrousavy/react-native-vision-camera) (advanced, but needs EAS build)
* [`react-native-reanimated`](https://docs.expo.dev/versions/latest/sdk/reanimated/)
* [`react-native-face-detector`](https://docs.expo.dev/versions/latest/sdk/face-detector/)

**🛠️ Implementation Steps:**

* Use `expo-camera` for front/rear toggle and recording.
* Use `react-native-reanimated` and face detection to overlay basic AR stickers.
* Use gesture handlers to swipe filters (basic Instagram-style filters).

> For advanced real-time AR filters like Snapchat Lenses, you'd need to eject and use lower-level vision libraries or integrate WebAR (e.g. 8thWall or Snap's Camera Kit SDK).

---

### **3. Create & Share a Snap**

**✅ Packages:**

* `expo-image-editor` or custom Canvas (for drawing/text)
* `react-native-view-shot` (to flatten edited Snap)
* Firebase Storage + Realtime DB
* Zustand to manage current Snap state

**🛠️ Implementation Steps:**

* Add tools to draw, overlay text/stickers (use `react-native-gesture-handler`).
* Use `react-native-view-shot` to capture the final image.
* Upload Snap to Firebase Storage.
* Save metadata (sender, recipient(s), expiry timestamp) to Realtime DB.

---

### **4. Chat & Group Messaging**

**✅ Packages:**

* Firebase Realtime Database (fastest option for ephemeral messaging)
* `uuid` for chat IDs
* Zustand to manage chat state
* Optional: `react-native-gifted-chat` (customizable chat UI)

**🛠️ Implementation Steps:**

* Use Firebase RTDB to store threads/messages.
* Messages include metadata: sender, recipient(s), sentAt, autoDeleteAfter.
* Set up listeners in RTDB and auto-delete logic after 24 hours/viewing.
* Use push notifications for new messages (with Expo Notifications).

---

### **5. Stories View**

**✅ Packages:**

* Same storage mechanism as Snaps
* Carousel UI: `react-native-snap-carousel` or horizontal FlatList
* Firebase Realtime DB + Storage

**🛠️ Implementation Steps:**

* Users upload to `/stories/{userId}/{storyId}`.
* Fetch stories of all friends ordered by time.
* Show circular avatars → tap to view full-screen Story.
* Delete story after 24h via Cloud Functions or client cleanup.

---

### **6. Add Friends & Contacts**

**✅ Packages:**

* `expo-contacts` (to access device contacts with permission)
* Firebase Realtime DB for storing friend requests and lists
* QR scanner: `expo-barcode-scanner`

**🛠️ Implementation Steps:**

* Store user data (username, phone/email, displayName) in `/users/{uid}`.
* Implement search with fuzzy match or prefix match.
* Friend request = a record in `/requests/{senderId}_{receiverId}`.
* On accept: add UIDs to each other’s friend lists.
* Scan QR (Snapcode clone) → extract and lookup username or UID.

---

### ✅ Zustand & NativeWind Integration

* Zustand stores: `user`, `currentSnap`, `chats`, `stories`, `friends`
* NativeWind = Tailwind for React Native via `NativeWind` or `twrnc`
* Use conditionals (`isLoggedIn`) to gate camera/chat access
* Responsive layouts are handled with Tailwind classes for different screen sizes

---

## 🔧 Dev Tools Recap

| Feature                  | Library / Tool                                |
| ------------------------ | --------------------------------------------- |
| Auth (email/phone)       | `firebase`, `react-native-phone-number-input` |
| Camera                   | `expo-camera`, `expo-face-detector`           |
| Drawing/Text on Snaps    | Custom Canvas, `react-native-view-shot`       |
| Real-time Chat           | Firebase Realtime DB                          |
| Stories                  | Firebase Storage + FlatList                   |
| Friends/Contacts         | `expo-contacts`, Firebase DB                  |
| State Management         | Zustand                                       |
| Styling                  | NativeWind (Tailwind for React Native)        |
| Notifications (Optional) | Expo Push Notifications                       |

