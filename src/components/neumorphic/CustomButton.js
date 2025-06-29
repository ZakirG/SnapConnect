import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * A custom button component with yellow background and white uppercase text.
 * Designed for primary actions in the authentication flow.
 *
 * @param {object} props - The component props.
 * @param {string} props.title - The text to be displayed on the button.
 * @param {function} props.onPress - The function to be executed when the button is pressed.
 * @param {boolean} [props.disabled=false] - Whether the button is disabled.
 * @param {boolean} [props.loading=false] - Whether the button is in loading state.
 * @param {string} [props.loadingTitle] - Alternative text to show when loading.
 * @param {object} [props.style] - Additional styles for the wrapper.
 * @returns {React.ReactElement}
 */
const CustomButton = ({ 
  title, 
  onPress, 
  disabled = false, 
  loading = false, 
  loadingTitle,
  style 
}) => {
  const isDisabled = disabled || loading;
  const displayTitle = loading && loadingTitle ? loadingTitle : title;

  return (
    <View style={[{ marginBottom: 20, width: '100%', alignItems: 'center', margin: 'auto' }, style]}>
      <TouchableOpacity
        onPress={isDisabled ? undefined : onPress}
        disabled={isDisabled}
        style={{
          backgroundColor: '#ffc400',
          borderRadius: 12,
          paddingVertical: 16,
          paddingHorizontal: 32,
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 'auto',
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
          opacity: isDisabled ? 0.7 : 1,
        }}
      >
        <Text style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: 16,
          textTransform: 'uppercase',
        }}>
          {displayTitle}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default CustomButton; 