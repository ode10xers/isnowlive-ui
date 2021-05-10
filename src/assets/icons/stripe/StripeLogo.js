import React from 'react';
import Icon from '@ant-design/icons';
import { ReactComponent as StripeSVG } from './stripe_logo.svg';

const StripeLogo = ({ height = 28, width = 28 }) => (
  <Icon component={() => <StripeSVG width={width} height={height} />} />
);

export default StripeLogo;
