import React from 'react';

import { Card, Typography } from 'antd';

import styles from './style.module.scss';

const { Text } = Typography;

export const generateCardHeadingStyle = (textColor = '#0050B3', backgroundColor = '#F1FBFF') => ({
  color: textColor,
  background: backgroundColor,
  borderRadius: '12px 12px 0 0',
  boxShadow: 'inset 0px -1px 0px #E6F5FB',
});

const ContainerCard = ({ title = '', icon = null, textColor = '#0050B3', backgroundColor = '#F1FBFF', children }) => {
  return (
    <Card
      className={styles.profileComponentContainer}
      bodyStyle={{ padding: 12 }}
      headStyle={generateCardHeadingStyle(textColor, backgroundColor)}
      title={
        <Text style={{ color: textColor }}>
          {icon}
          {title}
        </Text>
      }
    >
      {children}
    </Card>
  );
};

export default ContainerCard;
