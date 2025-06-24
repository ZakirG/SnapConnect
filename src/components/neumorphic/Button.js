import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { cssInterop } from 'nativewind';
import NeumorphicView from './NeumorphicView';

cssInterop(Pressable, {
  className: 'style',
});

/**
 * A Button component with neumorphic styling.
 * It provides visual feedback when pressed by toggling the inset shadow.
 *
 * @param {object} props - The component props.
 * @param {string} props.title - The text to be displayed on the button.
 * @param {function} props.onPress - The function to be executed when the button is pressed.
 * @param {function} props.onLongPress - The function to be executed when the button is long pressed.
 * @param {function} props.onPressOut - The function to be executed when the button is pressed out.
 * @param {object} [props.style] - Custom styles to be applied to the button.
 * @returns {React.ReactElement}
 */
const Button = ({
  title,
  onPress,
  onLongPress,
  onPressOut: onPressOutProp,
  style,
  ...rest
}) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={(evt) => {
        setIsPressed(false);
        if (typeof onPressOutProp === 'function') {
          onPressOutProp(evt);
        }
      }}
      style={style}
      {...rest}
    >
      <NeumorphicView inset={isPressed} className="rounded-full items-center justify-center p-4">
        <Text className="font-bold text-lg">{title}</Text>
      </NeumorphicView>
    </Pressable>
  );
};

export default Button; 