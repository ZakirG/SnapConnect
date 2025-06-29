/**
 * Guided tour component that displays instructional boxes for first-time users.
 * Shows a positioned box with customizable content and a separate arrow pointing to target elements.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.visible - Whether the tour step is currently visible.
 * @param {string} props.title - The title text for the tour step.
 * @param {string} props.description - The description text for the tour step.
 * @param {string} props.position - Position of the tour box ('center-above', 'bottom-right').
 * @param {function} props.onNext - Callback function when Next button is pressed.
 * @param {function} props.onSkip - Optional callback function when Skip button is pressed.
 * @param {boolean} props.showSkip - Whether to show the skip button.
 * @returns {React.ReactElement|null}
 */
import React from 'react';
import { View, Text, TouchableOpacity, Modal, Image } from 'react-native';
import { Card } from '../neumorphic';

const GuidedTour = ({ 
  visible, 
  title, 
  description,
  position = 'center-above',
  onNext, 
  onSkip,
  showSkip = false 
}) => {
  if (!visible) return null;

  // Position configurations for different tour steps
  const getPositioning = () => {
    switch (position) {
      case 'top-left':
        return {
          box: 'absolute top-48 left-4',
          arrow: 'absolute top-32 left-6',
          arrowStyle: { width: 48, height: 48, position: 'relative', left: 0, top: 0 },
          arrowImage: require('../../../assets/up-arrow.png')
        };
      case 'center-above':
        return {
          box: 'absolute bottom-72 left-1/2 -ml-[150px]',
          arrow: 'absolute bottom-60 left-1/2 -ml-3',
          arrowStyle: { width: 48, height: 48, position: 'relative', left: -15, top: 3 },
          arrowImage: require('../../../assets/down-arrow.png')
        };
      case 'bottom-right':
        return {
          box: 'absolute bottom-36 right-4',
          arrow: 'absolute bottom-24 left-72 -ml-6',
          arrowStyle: { width: 48, height: 48, position: 'relative', left: 0, top: 0 },
          arrowImage: require('../../../assets/down-arrow.png')
        };
      default:
        return {
          box: 'absolute bottom-72 left-1/2 -ml-[150px]',
          arrow: 'absolute bottom-60 left-1/2 -ml-3',
          arrowStyle: { width: 48, height: 48, position: 'relative', left: -15, top: 3 },
          arrowImage: require('../../../assets/down-arrow.png')
        };
    }
  };

  const positioning = getPositioning();

  return (
    <Modal transparent visible={visible} animationType="fade">
      {/* Semi-transparent overlay */}
      <View className="flex-1 bg-black/50">
        {/* Tour box */}
        <View className={positioning.box}>
          <Card style={{ width: 300, padding: 24 }}>
            {title && (
              <Text className="text-xl font-bold text-gray-900 mb-3 text-center">
                {title}
              </Text>
            )}
            
            <Text className="text-lg text-gray-700 mb-6 text-center leading-6">
              {description}
            </Text>

            {/* Action buttons */}
            <View className="flex-row justify-center space-x-4">
              {showSkip && (
                <TouchableOpacity
                  onPress={onSkip}
                  className="px-6 py-3 rounded-full bg-gray-200"
                >
                  <Text className="text-gray-700 font-semibold">Skip</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                onPress={onNext}
                style={{
                  backgroundColor: '#ffc400',
                  borderRadius: 12,
                  paddingVertical: 16,
                  paddingHorizontal: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 2, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <Text style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 16,
                  textTransform: 'uppercase',
                }}>
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Arrow pointing to target */}
        <View className={positioning.arrow}>
          <Image 
            source={positioning.arrowImage}
            style={positioning.arrowStyle}
            resizeMode="contain"
          />
        </View>
      </View>
    </Modal>
  );
};

export default GuidedTour; 