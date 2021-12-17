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
  initialValue = 1,
}) => {
  const [creatorPrice, setCreatorPrice] = useState(initialValue);
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

    return () => {
      setCreatorPrice(initialValue);
      setCalculatedPrice(null);
    };
  }, [form, name, feePercentage, initialValue]);

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
    <Row>
      <Col xs={12}>
        <Space size={1} direction="vertical" className={styles.w100}>
          <Row>
            <Col flex="2 1 70px">
              <InputNumber
                className={styles.w100}
                onChange={onCreatorPriceChange}
                min={minimalPrice}
                precision={2}
                placeholder={placeholderBefore}
                value={creatorPrice}
              />
            </Col>
            <Col flex="0 0 16px">
              <CalculatorOutlined className={styles.separatorIcon} />
            </Col>
          </Row>

          <Text type="secondary">Price you get</Text>
        </Space>
      </Col>

      <Col xs={12}>
        <Space size={1} direction="vertical" className={styles.w100}>
          <Row>
            <Col flex="2 1 70px">
              <InputNumber
                className={styles.w100}
                onChange={onCalculatedPriceChange}
                min={minimalPrice}
                precision={2}
                placeholder={placeholderAfter}
                value={calculatedPrice}
              />
            </Col>
            <Col flex="0 0 16px">
              <Tooltip
                title="You can input on any one of the fields and we'll calculate the other one for you (rounded up to 1 decimal place)"
                trigger="hover"
              >
                <InfoCircleOutlined className={styles.infoIcon} />
              </Tooltip>
            </Col>
          </Row>

          <Text type="secondary">Price customer sees</Text>
        </Space>
      </Col>
    </Row>
  );
};

export default PriceInputCalculator;
