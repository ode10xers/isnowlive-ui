import React from 'react';
import Icon from '@ant-design/icons';
import { ReactComponent as SepaSVG } from './sepa_logo.svg';

// Note: Sofort is owned by Klarna, so we use the same logo for them
const SepaLogo = ({ height = 28, width = 28, ...props }) => (
  <Icon component={() => <SepaSVG width={width} height={height} {...props} />} />
);

export default SepaLogo;
