import React from 'react';
import Icon from '@ant-design/icons';
import { ReactComponent as MastercardSVG } from './mastercard_logo.svg';

const MastercardLogo = ({ height = 28, width = 28 }) => (
  <Icon component={() => <MastercardSVG width={width} height={height} />} />
);

export default MastercardLogo;
