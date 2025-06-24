import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { cssInterop } from 'nativewind';
import NeumorphicView from './NeumorphicView';

cssInterop(Pressable, {
  className: 'style',
});

/**
 * A Button component with neumorphic styling following the design system.
 * Provides proper depth, shadows, and tactile feedback as per ui_rules.md.
 *
 * @param {object} props - The component props.
 * @param {string} [props.title] - The text to be displayed on the button.
 * @param {React.ReactNode} [props.children] - Custom content instead of title.
 * @param {function} props.onPress - The function to be executed when the button is pressed.
 * @param {function} [props.onLongPress] - The function to be executed when the button is long pressed.
 * @param {function} [props.onPressOut] - The function to be executed when the button is pressed out.
 * @param {'small' | 'medium' | 'large'} [props.size='medium'] - Button size variant.
 * @param {'primary' | 'secondary' | 'circular'} [props.variant='primary'] - Button style variant.
 * @param {object} [props.style] - Custom styles to be applied to the button.
 * @param {boolean} [props.disabled] - Whether the button is disabled.
 * @returns {React.ReactElement}
 */
const Button = ({
  title,
  children,
  onPress,
  onLongPress,
  onPressOut: onPressOutProp,
  size = 'medium',
  variant = 'primary',
  style,
  disabled = false,
  ...rest
}) => {
  const [isPressed, setIsPressed] = useState(false);

  // Size configurations
  const sizeConfig = {
    small: {
      padding: 'px-4 py-2',
      minHeight: 'min-h-[44px]', // Accessibility minimum
      text: 'text-sm font-semibold',
      borderRadius: 'rounded-xl',
    },
    medium: {
      padding: 'px-6 py-3',
      minHeight: 'min-h-[48px]',
      text: 'text-base font-semibold',
      borderRadius: 'rounded-2xl',
    },
    large: {
      padding: 'px-8 py-4',
      minHeight: 'min-h-[56px]',
      text: 'text-lg font-bold',
      borderRadius: 'rounded-2xl',
    },
  };

  // Variant configurations
  const variantConfig = {
    primary: {
      background: 'bg-gray-100',
      textColor: 'text-gray-800',
      disabledBg: 'bg-gray-200',
      disabledText: 'text-gray-400',
    },
    secondary: {
      background: 'bg-blue-100',
      textColor: 'text-blue-800',
      disabledBg: 'bg-blue-50',
      disabledText: 'text-blue-300',
    },
    circular: {
      background: 'bg-gray-100',
      textColor: 'text-gray-800',
      disabledBg: 'bg-gray-200',
      disabledText: 'text-gray-400',
      shape: 'rounded-full',
    },
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];

  const isCircular = variant === 'circular';
  const borderRadius = isCircular ? currentVariant.shape : currentSize.borderRadius;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onLongPress={disabled ? undefined : onLongPress}
      onPressIn={() => !disabled && setIsPressed(true)}
      onPressOut={(evt) => {
        if (!disabled) {
          setIsPressed(false);
          if (typeof onPressOutProp === 'function') {
            onPressOutProp(evt);
          }
        }
      }}
      style={style}
      disabled={disabled}
      {...rest}
    >
      <NeumorphicView
        inset={isPressed && !disabled}
        className={`
          ${borderRadius}
          ${currentSize.minHeight}
          ${disabled ? currentVariant.disabledBg : currentVariant.background}
          items-center justify-center
          ${isCircular ? 'aspect-square' : currentSize.padding}
          ${disabled ? 'opacity-60' : ''}
        `.trim()}
      >
        {children || (
          <Text
            className={`
              ${currentSize.text}
              ${disabled ? currentVariant.disabledText : currentVariant.textColor}
            `.trim()}
          >
            {title}
          </Text>
        )}
      </NeumorphicView>
    </Pressable>
  );
};

export default Button; 