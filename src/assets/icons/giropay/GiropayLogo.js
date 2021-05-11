import React from 'react';
import Icon from '@ant-design/icons';
import { ReactComponent as GiropaySVG } from './giropay_logo.svg';

const GiropayLogo = ({ height = 28, width = 28 }) => (
  <Icon component={() => <GiropaySVG width={width} height={height} />} />
);

export default GiropayLogo;
