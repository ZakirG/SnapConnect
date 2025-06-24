# Phase 1: Project Setup & Foundation

## Goal
Establish the foundational structure of the SnapConnect application, install essential dependencies, and create the basic UI shell with a neumorphic styling foundation. This phase will result in a runnable Expo project, but with no user-facing functionality yet.

## Deliverables
- A runnable Expo project configured with SDK 53.
- A well-defined project directory structure as specified in `README.md`.
- A basic neumorphic design system with core components.
- A placeholder navigation structure for all main screens.

---

## Features & Tasks

### 1. **Initialize Expo Project**
- **Description**: Set up a new React Native project using Expo.
- **Steps**:
    1. Initialize a new Expo project with the SDK 53 template.
    2. Configure `app.json` with the project name (`SnapConnect`), version, and platform-specific settings.
    3. Define standard scripts in `package.json` for starting the development server (`start`, `ios`, `android`).
    4. Set up the `.gitignore` file to exclude common files and directories (e.g., `node_modules`, `.expo`).

### 2. **Establish Project Directory Structure**
- **Description**: Create the folder structure to organize code logically.
- **Steps**:
    1. Create the `src/` directory for all source code.
    2. Create subdirectories: `components`, `screens`, `services`, `hooks`, `store`, `utils`, `styles`, and `types`.
    3. Further subdivide `components` into `ui`, `neumorphic`, `camera`, `chat`, and `stories`.
    4. Further subdivide `screens` into `auth`, `camera`, `chat`, and `social`.
    5. Add placeholder `index.ts` files within these directories to establish the module structure.

### 3. **Install Core Dependencies**
- **Description**: Add and configure the primary libraries for the tech stack.
- **Steps**:
    1. Install `react-navigation` and its dependencies (`@react-navigation/native`, `@react-navigation/stack`, `react-native-screens`, `react-native-safe-area-context`) for navigation.
    2. Install `nativewind` and `tailwindcss` for styling.
    3. Install `zustand` for global state management.
    4. Install the `firebase` SDK to prepare for backend integration.
    5. Install `react-native-gesture-handler` for advanced touch interactions.

### 4. **Implement Neumorphic Design System Foundation**
- **Description**: Create the base components and styling for the neumorphic UI.
- **UI References**: `neumorphic-reference-1.png`, `neumorphic-reference-2.png`.
- **Steps**:
    1. Configure `tailwind.config.js` to enable NativeWind and define the app's color palette, fonts, and shadow utilities as per `ui_rules.md`.
    2. Create a `NeumorphicView` base component that handles the soft shadow and highlight effect.
    3. Build foundational UI components in `src/components/neumorphic/`: `Button`, `Card`, and `Input`.
    4. Ensure all base components adhere to the principles outlined in `ui_rules.md`.

### 5. **Set Up Basic Navigation Shell**
- **Description**: Implement the app's primary navigation flow with placeholder screens.
- **Steps**:
    1. Create a root navigator using `react-navigation` that will manage the authentication and main app flows.
    2. Implement a stack navigator for the authentication flow (Signup, Login).
    3. Implement a tab or stack navigator for the main application screens (Camera, Chat, Stories).
    4. Create placeholder screen components for `LoginScreen`, `SignupScreen`, `CameraScreen`, `ChatScreen`, and `StoriesScreen`.
    5. The app should launch and allow navigation between these empty, styled placeholder screens. 