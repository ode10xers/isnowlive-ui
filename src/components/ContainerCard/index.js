import React from 'react';

import { Card, Typography } from 'antd';

import styles from './style.module.scss';

const { Text } = Typography;

export const generateCardHeadingStyle = (textColor = '#0050B3', backgroundColor = '#F1FBFF') => ({
  color: `var(--passion-profile-darker-color, ${textColor})`,
  background: `var(--passion-profile-light-color, ${backgroundColor})`,
  borderRadius: '12px 12px 0 0',
  boxShadow: 'inset 0px -1px 0px #E6F5FB',
});

const ContainerCard = ({ title = '', icon = null, textColor = '#0050B3', backgroundColor = '#F1FBFF', children }) => {
  return (
    <Card
      className={styles.profileComponentContainer}
      bodyStyle={{ padding: 12, backgroundColor: 'var(--passion-profile-lightest-color, white)' }}
      headStyle={generateCardHeadingStyle(textColor, backgroundColor)}
      title={
        <Text
          style={{
            color: `var(--passion-profile-darker-color, ${textColor})`,
          }}
        >
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
