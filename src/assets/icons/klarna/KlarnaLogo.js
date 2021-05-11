import React from 'react';
import Icon from '@ant-design/icons';
import { ReactComponent as KlarnaSVG } from './klarna_logo.svg';

// Note: Sofort is owned by Klarna, so we use the same logo for them
const KlarnaLogo = ({ height = 28, width = 28 }) => (
  <Icon component={() => <KlarnaSVG width={width} height={height} />} />
);

export default KlarnaLogo;
