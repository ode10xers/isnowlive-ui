import React from 'react';

import { Row, Col, Button, Typography } from 'antd';
import { CaretRightOutlined, CheckOutlined, PlusOutlined } from '@ant-design/icons';

import { redirectToMembershipPage } from 'utils/redirect';
import { generateBaseCreditsText, generateSubscriptionDuration } from 'utils/subscriptions';
import { convertHexToHSL, formatHSLStyleString } from 'utils/colors';

import styles from './style.module.scss';

const { Text, Paragraph } = Typography;

const SelectableSubscriptionItem = ({
  subscription = null,
  showExtra = false,
  onSelect = null,
  onDeselect = null,
  onDetails = null,
  isSelected = false,
}) => {
  const handleSelectClicked = (subscription) => {
    if (onSelect) {
      onSelect(subscription);
    } else {
      console.log(subscription);
    }
  };

  const handleDeselectClicked = (subscription) => {
    if (onDeselect) {
      onDeselect(subscription);
    } else {
      console.log(subscription);
    }
  };

  const handleDetailsClicked = (subscription) => {
    if (onDetails) {
      onDetails(subscription);
    } else {
      redirectToMembershipPage(subscription);
    }
  };

  const [h, s, l] = convertHexToHSL(subscription?.color_code ?? '#1890ff');

  const colorObj = {
    '--primary-color': formatHSLStyleString(h, s, l),
    '--primary-light-color': formatHSLStyleString(h, s, l + 25),
    '--primary-lightest-color': formatHSLStyleString(h, s, l + 45),
    '--primary-dark-color': formatHSLStyleString(h, s, l - 20),
  };

  return (
    <div className={styles.selectableSubscriptionItem} style={colorObj}>
      <Row gutter={[8, 8]}>
        <Col xs={24} className={styles.subscriptionItemHeadingContainer}>
          <Row gutter={[8, 8]} wrap={false} className={styles.subscriptionItemHeading}>
            <Col flex="1 1 auto">
              <Text className={styles.subscriptionName}>{subscription?.name}</Text>
            </Col>
            <Col flex="0 0 90px" className={styles.textAlignRight}>
              {subscription?.total_price > 0 ? (
                <>
                  <Text className={styles.subscriptionCurrency}>{subscription?.currency?.toUpperCase() ?? ''} </Text>
                  <Text className={styles.subscriptionPrice}>{subscription?.total_price ?? 0}</Text>
                </>
              ) : (
                'Free'
              )}
            </Col>
          </Row>
        </Col>
        <Col xs={24} className={styles.subscriptionDetailsContainer}>
          <Paragraph className={styles.subscriptionDetails}>
            {generateBaseCreditsText(subscription, false).replace('/period', '')}
          </Paragraph>
          <Paragraph className={styles.subscriptionDetails}>
            every {generateSubscriptionDuration(subscription, true)}
          </Paragraph>
        </Col>
        {showExtra && (
          <Col xs={24} className={styles.extraButtonsContainer}>
            <Row gutter={[8, 8]} wrap="false">
              <Col xs={12}>
                {isSelected ? (
                  <Button
                    size="small"
                    type="text"
                    className={styles.selectedBtn}
                    icon={<CheckOutlined />}
                    onClick={() => handleDeselectClicked(subscription)}
                  >
                    Selected
                  </Button>
                ) : (
                  <Button
                    size="small"
                    type="text"
                    className={styles.extraBtn}
                    icon={<PlusOutlined />}
                    onClick={() => handleSelectClicked(subscription)}
                  >
                    Select
                  </Button>
                )}
              </Col>
              <Col xs={12} className={styles.textAlignRight}>
                <Button
                  size="small"
                  type="text"
                  className={styles.extraBtn}
                  onClick={() => handleDetailsClicked(subscription)}
                >
                  Details <CaretRightOutlined />
                </Button>
              </Col>
            </Row>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default SelectableSubscriptionItem;
