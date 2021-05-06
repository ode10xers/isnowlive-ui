import React from 'react';

import { Typography, InputNumber, Space } from 'antd';

import styles from './styles.module.scss';

const { Text } = Typography;

const InputPriceAmount = ({ onInputChange, inputValue, minimum, suffix = null }) => {
  return (
    <Space>
      <Text>Your fair price</Text>
      <InputNumber
        className={styles.compactNumericalInput}
        size="small"
        onChange={onInputChange}
        min={minimum}
        value={inputValue}
      />
      {suffix && <Text> {suffix} </Text>}
    </Space>
  );
};

export default InputPriceAmount;
