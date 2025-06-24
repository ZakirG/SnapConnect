import React from 'react';
import NeumorphicView from './NeumorphicView';

/**
 * A Card component with neumorphic styling.
 * It's a container for content that appears raised from the background.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content to be rendered inside the card.
 * @param {object} [props.style] - Custom styles to be applied to the card.
 * @returns {React.ReactElement}
 */
const Card = ({ children, style }) => {
  return (
    <NeumorphicView style={style} className="rounded-xl p-4">
      {children}
    </NeumorphicView>
  );
};

export default Card; 