import React from 'react';
import { Typography } from 'antd';

import styles from './styles.module.scss';

const { Text } = Typography;

const ShowAmount = ({ amount, currency }) => {
  return (
    <>
      <Text className={styles.currency}>{currency || 'USD'} </Text>
      <Text className={styles.amount}>{parseInt(amount || 0)}</Text>
      <Text className={styles.currency}>
        .
        {parseFloat(amount || 0)
          .toFixed(2)
          .split('.')
          .pop()}
      </Text>
    </>
  );
};

export default ShowAmount;
