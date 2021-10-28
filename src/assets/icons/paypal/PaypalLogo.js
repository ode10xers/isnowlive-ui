import React from 'react';
import Icon from '@ant-design/icons';
import { ReactComponent as PaypalSVG } from './paypal_logo.svg';

const PaypalLogo = ({ height = 28, width = 28, ...props }) => (
  <Icon component={() => <PaypalSVG width={width} height={height} {...props} />} />
);

export default PaypalLogo;
