import React from 'react';
import Icon from '@ant-design/icons';
import { ReactComponent as GooglePaySVG } from './gpay_logo.svg';

const GooglePayLogo = ({ height = 28, width = 28 }) => (
  <Icon component={() => <GooglePaySVG width={width} height={height} />} />
);

export default GooglePayLogo;
