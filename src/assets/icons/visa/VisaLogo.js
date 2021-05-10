import React from 'react';
import Icon from '@ant-design/icons';
import { ReactComponent as VisaSVG } from './visa_logo.svg';

const VisaLogo = ({ height = 28, width = 28 }) => <Icon component={() => <VisaSVG width={width} height={height} />} />;

export default VisaLogo;
