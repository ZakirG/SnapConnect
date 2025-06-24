import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { cssInterop } from 'nativewind';

cssInterop(View, { className: 'style' });

/**
 * A base component for creating neumorphic UI elements following ui_rules.md.
 * Creates proper depth through light and dark shadows positioned at 45-degree angle.
 * Provides both outset (raised) and inset (pressed) effects.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content to be rendered inside the view.
 * @param {object} [props.style] - Custom styles to be applied to the view.
 * @param {string} [props.className] - Tailwind classes for additional styling.
 * @param {boolean} [props.inset=false] - If true, applies an inset shadow effect.
 * @returns {React.ReactElement}
 */
const NeumorphicView = ({ children, style, className, inset = false }) => {
  const neumorphicStyle = inset ? styles.neumorphicInset : styles.neumorphicOutset;

  return (
    <View style={[neumorphicStyle, style]} className={className}>
      {Platform.OS === 'ios' && !inset && (
        // Light shadow for iOS outset effect
        <View style={styles.lightShadowIOS} />
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  neumorphicOutset: {
    backgroundColor: '#f0f0f3', // Soft neutral background as per ui_rules.md
    ...Platform.select({
      ios: {
        // Dark shadow - bottom right (45-degree light source from top-left)
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
        // Android doesn't support dual shadows natively, so we use elevation
        shadowColor: 'rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  neumorphicInset: {
    backgroundColor: '#e6e6e9', // Slightly darker for inset effect
    ...Platform.select({
      ios: {
        // Inset shadow - inverted to simulate pressed effect
        shadowColor: 'rgba(0, 0, 0, 0.15)',
        shadowOffset: { width: -2, height: -2 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      android: {
        elevation: 0,
        // Simulate inset with border
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
        borderLeftColor: 'rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  lightShadowIOS: {
    // Light highlight shadow for iOS - positioned opposite to dark shadow
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    shadowColor: 'rgba(255, 255, 255, 0.8)',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    zIndex: -1,
  },
});

cssInterop(NeumorphicView, {
  className: 'style',
});

export default NeumorphicView; 