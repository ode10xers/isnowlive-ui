import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames';

import { Card, Space, Typography, Image, Divider, Row, Col, Spin, Tag } from 'antd';
import { ClockCircleOutlined, HourglassOutlined } from '@ant-design/icons';

import dateUtil from 'utils/date';
import { isValidFile, preventDefaults, isoDayOfWeek } from 'utils/helper';
import { redirectToInventoryPage, redirectToSessionsPage } from 'utils/redirect';

import styles from './style.module.scss';
import { getDaysForSession, mapInventoryDays } from 'utils/session';
const DefaultImage = require('assets/images/greybg.jpg');

const {
  formatDate: { getTimeDiff, toShortTimeWithPeriod },
} = dateUtil;

const { Text, Title } = Typography;

// NOTE : Now this component also supports rendering Session Objects
// (previously it was rendering inventory objects only), we differentiate
// based on whether inventory_id is present or not
const SessionListCard = ({ session }) => {
  // const extraTags = (
  //   <Space>
  //     <Tag color="green"> Everyone </Tag>
  //     <Tag color="cyan"> {adjustedSession?.group ? 'Group' : '1-on-1'} </Tag>
  //   </Space>
  // );
  const [isLoading, setIsLoading] = useState(false);
  const [adjustedSession, setAdjustedSession] = useState(session);

  const adjustSession = useCallback(async (sessionData) => {
    setIsLoading(true);

    if (sessionData.inventory) {
      setAdjustedSession({
        ...sessionData,
        inventory_days: mapInventoryDays(sessionData.inventory),
      });
    } else {
      setAdjustedSession({
        ...sessionData,
        inventory_days: await getDaysForSession(sessionData.session_id),
      });
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (session && !session.inventory_id) {
      adjustSession(session);
    }
  }, [session, adjustSession]);

  const sessionImage = (
    <div className={styles.sessionCoverContainer}>
      {/* <div className={styles.extraTagsContainer}>{extraTags}</div> */}
      <div className={styles.sessionImageContainer}>
        <Image
          loading="lazy"
          preview={false}
          className={styles.sessionImage}
          src={isValidFile(adjustedSession?.session_image_url) ? adjustedSession?.session_image_url : DefaultImage}
        />
      </div>
    </div>
  );

  const sessionTitle = (
    <Title
      level={4}
      className={classNames(
        styles.sessionTitle,
        adjustedSession?.name.length <= 28
          ? styles.textLength28
          : adjustedSession?.name.length <= 56
          ? styles.textLength56
          : styles.textLength84
      )}
    >
      {adjustedSession?.name}
    </Title>
  );

  const renderSessionPrice = () => {
    if (adjustedSession?.pay_what_you_want) {
      return 'Flexible';
    } else if (adjustedSession?.total_price === 0 || adjustedSession?.currency === '') {
      return 'Free';
    } else {
      return `${adjustedSession?.currency.toUpperCase()} ${adjustedSession?.total_price}`;
    }
  };

  const bottomCardBar = (
    <Space
      split={adjustedSession?.inventory_id ? <Divider type="vertical" className={styles.footerDivider} /> : null}
      align="center"
      className={styles.cardFooter}
    >
      {adjustedSession?.inventory_id ? (
        <>
          <Text className={styles.footerText}>
            <HourglassOutlined className={styles.textIcons} />
            {getTimeDiff(adjustedSession?.end_time, adjustedSession?.start_time, 'minutes')} mins
          </Text>
          <Text className={styles.footerText}>
            <ClockCircleOutlined className={styles.textIcons} /> {toShortTimeWithPeriod(adjustedSession?.start_time)}
          </Text>
        </>
      ) : (
        <Space size={2} className={styles.sessionDayTagsContainer}>
          {isoDayOfWeek.map((day, index) => (
            <Tag
              key={`${adjustedSession.session_id}_${day}`}
              className={
                adjustedSession.inventory_days?.includes(index + 1) ? styles.sessionTags : styles.sessionTagsDisabled
              }
              color={adjustedSession.inventory_days?.includes(index + 1) ? 'blue' : 'default'}
            >
              {day[0]}
            </Tag>
          ))}
        </Space>
      )}
      <Text className={styles.priceText}> {renderSessionPrice()} </Text>
    </Space>
  );

  const handleCardClicked = (e) => {
    preventDefaults(e);

    // NOTE : This special check is there to act as a fallback navigation
    // to handle the case of zombie inventories (inventories that's booked, but the sessions deleted)
    if (!adjustedSession.session_external_id) redirectToInventoryPage({ ...session, ...session.inventory[0] });
    else if (adjustedSession.inventory_id) {
      redirectToInventoryPage(session);
    } else {
      redirectToSessionsPage(session);
    }
  };

  return (
    <Card
      className={styles.sessionListCard}
      cover={sessionImage}
      bodyStyle={{ padding: 0 }}
      onClick={handleCardClicked}
    >
      <Spin spinning={isLoading}>
        <Row>
          <Col xs={24}>{sessionTitle}</Col>
          <Col xs={24}>{bottomCardBar}</Col>
        </Row>
      </Spin>
    </Card>
  );
};

export default SessionListCard;
