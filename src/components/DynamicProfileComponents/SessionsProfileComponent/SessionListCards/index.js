import React from 'react';
// import ReactHtmlParser from 'react-html-parser';

import { Card, Space, Tag, Typography, Image, Divider, Row, Col } from 'antd';
import { ClockCircleOutlined, HourglassOutlined } from '@ant-design/icons';

import dateUtil from 'utils/date';
import { isValidFile } from 'utils/helper';

import styles from './style.module.scss';
const DefaultImage = require('assets/images/greybg.jpg');

const {
  formatDate: { getTimeDiff, toShortTimeWithPeriod },
} = dateUtil;

const { Text, Title } = Typography;

const SessionListCards = ({ session }) => {
  const extraTags = (
    <Space>
      <Tag color="green"> Everyone </Tag>
      <Tag color="cyan"> {session?.group ? 'Group' : '1-on-1'} </Tag>
    </Space>
  );

  const sessionImage = (
    <div className={styles.sessionCoverContainer}>
      <div className={styles.extraTagsContainer}>{extraTags}</div>
      <div className={styles.sessionImageContainer}>
        <Image
          preview={false}
          className={styles.sessionImage}
          src={isValidFile(session?.session_image_url) ? session?.session_image_url : DefaultImage}
        />
      </div>
    </div>
  );

  // // TODO: Manage overflowing content here later
  // const sessionDescription = (
  //   <div className={styles.sessionDescriptionContainer}>
  //     {ReactHtmlParser(session?.description)}
  //   </div>
  // );

  const sessionTitle = (
    <Title level={4} className={styles.sessionTitle}>
      {session?.name}
    </Title>
  );

  const renderSessionPrice = () => {
    if (session?.pay_what_you_want) {
      return 'Flexible';
    } else if (session?.price === 0 || session?.currency === '') {
      return 'Free';
    } else {
      return `${session?.currency.toUpperCase()} ${session?.price}`;
    }
  };

  const bottomCardBar = (
    <Space
      split={<Divider type="vertical" className={styles.footerDivider} />}
      align="center"
      className={styles.cardFooter}
    >
      <Text>
        {' '}
        <HourglassOutlined className={styles.textIcons} />{' '}
        {getTimeDiff(session?.end_time, session?.start_time, 'minutes')} mins{' '}
      </Text>
      <Text>
        {' '}
        <ClockCircleOutlined className={styles.textIcons} /> {toShortTimeWithPeriod(session?.start_time)}{' '}
      </Text>
      <Text className={styles.priceText}> {renderSessionPrice()} </Text>
    </Space>
  );

  return (
    <Card className={styles.sessionListCard} cover={sessionImage} bodyStyle={{ padding: 0 }}>
      <Row>
        <Col xs={24}>{sessionTitle}</Col>
        <Col xs={24}>{bottomCardBar}</Col>
      </Row>
    </Card>
  );
};

export default SessionListCards;
