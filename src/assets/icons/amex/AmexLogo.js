import React from 'react';
import Icon from '@ant-design/icons';
import { ReactComponent as AmexSVG } from './amex_logo.svg';

const AmexLogo = ({ height = 28, width = 28, ...props }) => (
  <Icon component={() => <AmexSVG width={width} height={height} {...props} />} />
);

export default AmexLogo;
