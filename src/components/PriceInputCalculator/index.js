import React, { useState, useEffect } from 'react';

import { InputNumber, Tooltip, Typography, Row, Col, Space } from 'antd';
import { CalculatorOutlined, InfoCircleOutlined } from '@ant-design/icons';

import styles from './style.module.scss';

const { Text } = Typography;

// NOTE : This component requires the feePercentage, which currently
// can be fetched from the settings API
const PriceInputCalculator = ({
  name,
  form,
  minimalPrice = 1,
  placeholderBefore = 'Price you get',
  placeholderAfter = 'Price customer sees',
  feePercentage = 0.1,
  defaultValue = 1,
}) => {
  const [creatorPrice, setCreatorPrice] = useState(defaultValue);
  const [calculatedPrice, setCalculatedPrice] = useState(null);

  useEffect(() => {
    let fieldValue = null;

    if (typeof name === 'string') {
      fieldValue = form.getFieldsValue()[name];
    } else if (Array.isArray(name)) {
      fieldValue = form.getFieldValue(name);
    }

    if (fieldValue && !isNaN(fieldValue)) {
      setCreatorPrice(fieldValue);

      if (feePercentage > 0) {
        setCalculatedPrice(fieldValue * (1 + feePercentage));
      } else {
        setCalculatedPrice(null);
      }
    }
  }, [form, name, feePercentage]);

  const onCreatorPriceChange = (numValue) => {
    if (typeof numValue === 'number' && !isNaN(numValue) && numValue > 0) {
      setCreatorPrice(numValue);
      setCalculatedPrice(numValue * (1 + feePercentage));

      form.setFields([
        {
          name: name,
          value: numValue,
        },
      ]);
    }
  };

  const onCalculatedPriceChange = (numValue) => {
    if (typeof numValue === 'number' && !isNaN(numValue) && numValue > 0) {
      setCalculatedPrice(numValue);
      const creatorPrice = numValue / (1 + feePercentage);
      setCreatorPrice(creatorPrice);

      form.setFields([
        {
          name: name,
          value: creatorPrice,
        },
      ]);
    }
  };

  if (feePercentage <= 0) {
    return null;
  }

  return (
    <Row gutter={[8, 8]}>
      <Col flex="140px">
        <Space size={1} direction="vertical" className={styles.w100}>
          <InputNumber
            className={styles.w100}
            onChange={onCreatorPriceChange}
            min={minimalPrice}
            precision={2}
            placeholder={placeholderBefore}
            value={creatorPrice}
          />
          <Text type="secondary">Price you get</Text>
        </Space>
      </Col>
      <Col flex="40px">
        <CalculatorOutlined />
      </Col>
      <Col flex="140px">
        <Space size={1} direction="vertical" className={styles.w100}>
          <InputNumber
            className={styles.w100}
            onChange={onCalculatedPriceChange}
            min={minimalPrice}
            precision={2}
            placeholder={placeholderAfter}
            value={calculatedPrice}
          />
          <Text type="secondary">Price customer sees</Text>
        </Space>
      </Col>
      <Col flex="40px">
        <Tooltip title="">
          <InfoCircleOutlined />
        </Tooltip>
      </Col>
    </Row>
  );
};

export default PriceInputCalculator;
