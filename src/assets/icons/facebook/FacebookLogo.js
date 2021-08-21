import React from 'react';
import Icon from '@ant-design/icons';
import { ReactComponent as FacebookSVG } from './facebook.svg';

const FacebookLogo = ({ height = 28, width = 28, ...props }) => (
  <Icon component={() => <FacebookSVG width={width} height={height} {...props} />} />
);

export default FacebookLogo;
