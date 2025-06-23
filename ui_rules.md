# SnapConnect UI Design Rules - Neumorphic Style

## Design Philosophy
SnapConnect embraces a neumorphic design language that creates soft, tactile interfaces through subtle shadows and highlights. This approach provides depth and physicality while maintaining the playful, social nature of ephemeral messaging.

## Reference Images
- **Neumorphic Style References:** `neumorphic-reference-1.png`, `neumorphic-reference-2.png`
- **Snapchat Functionality References:** `signup-view.jpeg`, `login-view.jpeg`, `home-authenticated.jpeg`, `camera-view.jpeg`, `home-unauthenticated.jpeg`

## Core Neumorphic Principles

### 1. Depth Through Light
- All interactive elements must have both inset and outset shadows
- Light source positioned at top-left (45-degree angle)
- Shadows should be subtle and never harsh or dramatic
- Use consistent shadow values across all components

### 2. Soft Edges
- All buttons, cards, and interactive elements must have rounded corners
- Border radius should be consistent (recommended: 12-16px for cards, 8-12px for buttons)
- Avoid sharp edges or geometric shapes
- Maintain organic, pill-like forms where appropriate

### 3. Tactile Feedback
- Pressed states should show inset shadows to simulate depression
- Hover states should slightly raise elements
- All interactive elements must provide clear visual feedback
- Use subtle animations for state transitions

## Color Palette Rules

### 1. Background Colors
- Primary background: Soft, neutral gray (#f0f0f3)
- Secondary background: Slightly darker gray (#e6e6e9)
- Avoid pure white or black backgrounds
- Maintain consistent background hierarchy

### 2. Shadow Colors
- Light shadow: White with low opacity (rgba(255,255,255,0.7))
- Dark shadow: Soft gray with low opacity (rgba(0,0,0,0.1))
- Never use pure black shadows
- Maintain shadow consistency across all elements

### 3. Accent Colors
- Primary accent: SnapConnect brand color (to be defined)
- Secondary accents: Soft blues, purples, and pinks
- Use gradients sparingly and only for special elements
- Maintain color accessibility standards

## Component-Specific Rules

### 1. Buttons
- All buttons must have neumorphic styling with outset shadows
- Pressed state must show inset shadows
- Use consistent padding and sizing
- Text should be clearly readable with proper contrast
- Avoid flat or material design button styles

### 2. Cards and Containers
- All cards must have subtle outset shadows
- Use consistent border radius
- Maintain proper spacing between cards
- Background should be slightly elevated from main background
- Avoid sharp edges or harsh shadows

### 3. Input Fields
- Text inputs should have inset shadows to appear "pressed in"
- Focus states should show subtle highlight
- Maintain consistent styling with other form elements
- Use soft, rounded corners

### 4. Navigation Elements
- Tab bars and navigation should have subtle elevation
- Active states should be clearly distinguished
- Use consistent icon sizing and spacing
- Maintain tactile feel throughout navigation

## Screen-Specific Guidelines

### 1. Authentication Screens (referencing signup-view.jpeg, login-view.jpeg)
- Forms should appear as soft, elevated cards
- Input fields should have inset styling
- Buttons should have clear neumorphic styling
- Maintain clean, uncluttered layout
- Use consistent spacing and typography

### 2. Camera Interface (referencing camera-view.jpeg)
- Camera controls should float with neumorphic styling
- Avoid heavy overlays that obstruct camera view
- Use subtle shadows for control buttons
- Maintain accessibility in bright lighting conditions
- Keep interface minimal and functional

### 3. Chat and Stories (referencing home-authenticated.jpeg)
- Message bubbles should have soft, rounded styling
- Story circles should have subtle elevation
- Maintain clear visual hierarchy
- Use consistent spacing between elements
- Avoid harsh contrasts or sharp edges

## Typography Rules

### 1. Font Selection
- Use system fonts for optimal performance
- Maintain consistent font weights
- Ensure readability across all background colors
- Use appropriate font sizes for different contexts

### 2. Text Contrast
- Maintain WCAG AA contrast standards
- Avoid light text on light backgrounds
- Use proper text shadows when needed
- Ensure readability in all lighting conditions

## Animation and Interaction Rules

### 1. Micro-interactions
- All button presses should have subtle animations
- Use consistent timing for all animations (200-300ms)
- Avoid jarring or sudden movements
- Maintain smooth, organic feel

### 2. State Transitions
- Loading states should use neumorphic styling
- Error states should be clearly communicated
- Success states should provide positive feedback
- Maintain consistency across all interactions

## Accessibility Guidelines

### 1. Touch Targets
- Minimum 44px touch target size
- Maintain proper spacing between interactive elements
- Ensure easy access for users with motor difficulties

### 2. Visual Accessibility
- Maintain proper contrast ratios
- Use clear visual indicators for interactive elements
- Provide alternative text for icons
- Support system accessibility features

## Implementation Standards

### 1. Consistency
- Use consistent shadow values across all components
- Maintain uniform border radius throughout the app
- Apply consistent spacing and padding
- Use standardized color values

### 2. Performance
- Optimize shadow rendering for smooth performance
- Use efficient animation techniques
- Minimize re-renders and layout shifts
- Maintain 60fps animations

### 3. Cross-Platform Compatibility
- Ensure neumorphic styling works on both iOS and Android
- Test on various screen sizes and densities
- Maintain consistent appearance across devices
- Consider platform-specific design patterns

## Quality Assurance

### 1. Visual Testing
- Test in various lighting conditions
- Verify shadow consistency across all screens
- Ensure proper contrast and readability
- Validate accessibility standards

### 2. Interaction Testing
- Verify all interactive elements provide proper feedback
- Test touch targets and spacing
- Ensure smooth animations and transitions
- Validate gesture recognition

### 3. Performance Testing
- Monitor frame rates during interactions
- Test on lower-end devices
- Verify smooth scrolling and animations
- Ensure responsive design across screen sizes
