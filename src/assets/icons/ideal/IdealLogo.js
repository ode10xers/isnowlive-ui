import React from 'react';
import Icon from '@ant-design/icons';
import { ReactComponent as IdealSVG } from './ideal_logo.svg';

const IdealLogo = ({ height = 28, width = 28 }) => (
  <Icon component={() => <IdealSVG width={width} height={height} />} />
);

export default IdealLogo;
