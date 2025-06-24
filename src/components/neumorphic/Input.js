import React from 'react';
import { TextInput } from 'react-native';
import { cssInterop } from 'nativewind';
import NeumorphicView from './NeumorphicView';

cssInterop(TextInput, {
  className: 'style',
});

/**
 * An Input component with neumorphic styling.
 * It appears "pressed in" to the background.
 *
 * @param {object} props - The component props.
 * @param {string} [props.placeholder] - The placeholder text for the input.
 * @param {function} [props.onChangeText] - The function to be executed when the text changes.
 * @param {string} [props.value] - The value of the input.
 * @param {boolean} [props.secureTextEntry=false] - If true, obscures the text entered.
 * @param {object} [props.style] - Custom styles to be applied to the input container.
 * @returns {React.ReactElement}
 */
const Input = ({ placeholder, onChangeText, value, secureTextEntry = false, style }) => {
  return (
    <NeumorphicView inset style={[{ borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }, style]}>
      <TextInput
        placeholder={placeholder}
        onChangeText={onChangeText}
        value={value}
        secureTextEntry={secureTextEntry}
        className="text-base"
        placeholderTextColor="#a0a0a0"
      />
    </NeumorphicView>
  );
};

export default Input; 