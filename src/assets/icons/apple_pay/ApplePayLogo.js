import React from 'react';
import Icon from '@ant-design/icons';
import { ReactComponent as ApplePaySVG } from './apple_pay_logo.svg';

const ApplePayLogo = ({ height = 28, width = 28, ...props }) => (
  <Icon component={() => <ApplePaySVG width={width} height={height} {...props} />} />
);

export default ApplePayLogo;
