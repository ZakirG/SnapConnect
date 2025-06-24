import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { cssInterop } from 'nativewind';

cssInterop(View, { className: 'style' });

/**
 * A base component for creating neumorphic UI elements.
 * It applies soft shadow and highlight effects to create a sense of depth.
 *
 * On iOS, it uses a simplified single-shadow approach. A true double shadow
 * would require a more complex implementation (e.g., nested views or a dedicated library).
 * On Android, it uses `elevation` for a simpler shadow.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content to be rendered inside the view.
 * @param {object} [props.style] - Custom styles to be applied to the view.
 * @param {boolean} [props.inset=false] - If true, applies an inset shadow effect.
 * @returns {React.ReactElement}
 */
const NeumorphicView = ({ children, style, inset = false }) => {
  const neumorphicStyle = inset ? styles.neumorphicInset : styles.neumorphicOutset;

  return (
    <View style={[neumorphicStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  neumorphicOutset: {
    backgroundColor: '#f0f0f3', // theme.colors.background
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.1)', // theme.colors['shadow-dark']
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 10,
        // TODO: Implement dual shadow (light and dark) for a true neumorphic effect.
      },
      android: {
        elevation: 8,
      },
    }),
  },
  neumorphicInset: {
    backgroundColor: '#e6e6e9', // theme.colors['background-secondary']
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.1)', // theme.colors['shadow-dark']
        shadowOffset: { width: -2, height: -2 },
        shadowOpacity: 1,
        shadowRadius: 5,
        // TODO: Implement dual shadow (light and dark) for a true neumorphic effect.
      },
      android: {
        elevation: 0, // Inset effect on Android is faked by removing elevation
      },
    }),
  },
});

cssInterop(NeumorphicView, {
  className: 'style',
});

export default NeumorphicView; 