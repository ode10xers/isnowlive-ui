import React from 'react';
import classNames from 'classnames';
import { Row, Col, Typography, Card, Image } from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';

import styles from './styles.module.scss';

const { Text } = Typography;

const cardBrandImages = {
  VISA: require('../../../assets/icons/visa_logo.png'),
  AMEX: require('../../../assets/icons/amex_logo.png'),
  MASTERCARD: require('../../../assets/icons/mastercard_logo.png'),
};

const SavedCards = ({ disabled, userCards, selectedCard, setSelectedCard }) => {
  const handleSelectCard = (e, userCard) => {
    e.stopPropagation();

    if (!disabled) {
      setSelectedCard(userCard);
    }
  };

  const toggleSelectedCard = (userCard) => {
    if (selectedCard && userCard.external_id === selectedCard.external_id) {
      setSelectedCard(null);
    } else {
      setSelectedCard(userCard);
    }
  };

  const renderSavedCardsItem = (userCard) => {
    return (
      <Card
        bodyStyle={{ padding: '4px 2px' }}
        key={userCard.external_id}
        className={classNames(
          styles.savedCardElement,
          disabled ? styles.disabled : undefined,
          userCard.external_id === selectedCard?.external_id ? styles.selected : undefined
        )}
        onClick={() => toggleSelectedCard(userCard)}
      >
        <Row gutter={8}>
          <Col xs={2} className={styles.radioWrapper}>
            {selectedCard && selectedCard.external_id === userCard.external_id ? (
              <div onClick={(e) => handleSelectCard(e, null)}>
                <CheckCircleTwoTone twoToneColor="#52c41a" />
              </div>
            ) : (
              <div className={styles.roundBtn} onClick={(e) => handleSelectCard(e, userCard)} />
            )}
          </Col>
          <Col xs={15} className={styles.helpTextWrapper}>
            {selectedCard && selectedCard.external_id === userCard.external_id
              ? 'Uncheck to pay with other card'
              : 'Check to pay with this card'}
          </Col>
          <Col xs={3} className={styles.cardBrandWrapper}>
            <Image
              className={styles.cardBrandImage}
              preview={false}
              src={cardBrandImages[userCard.brand.toUpperCase()]}
              alt=""
            />
          </Col>
          <Col xs={4}>{userCard.last_digits}</Col>
        </Row>
      </Card>
    );
  };

  return (
    <Row gutter={[8, 8]}>
      <Col xs={24}>
        <Text strong> Use your last used payment method </Text>
      </Col>
      <Col xs={24}>{userCards.map(renderSavedCardsItem)}</Col>
      <Col xs={24}>
        <Text strong>Or use a new payment method</Text>
      </Col>
    </Row>
  );
};

export default SavedCards;
