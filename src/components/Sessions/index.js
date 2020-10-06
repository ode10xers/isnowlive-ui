import React from 'react';
import MobileDetect from 'mobile-detect';
import moment from 'moment';
import { Card, Image, Row, Col, Typography, Divider } from 'antd';
import Section from '../Section';
import styles from './style.module.scss';

const { Text, Title } = Typography;

const Sessions = ({ sessions }) => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());

  const description = (session) => {
    return (
      <>
        <Text className={styles.day} strong>
          {moment(session.date).format('D').padStart(2, 0)}
        </Text>
        <Text strong> {moment(session.date).format('MMM')?.toUpperCase()} </Text>
        <Text type="secondary">
          {' '}
          <Divider type="vertical" /> {moment(session.starttime).format('LT')}
          {' -'}
        </Text>
        <Text type="secondary"> {moment(session.endtime).format('LT')} </Text>
      </>
    );
  };

  return (
    <Section>
      <Row>
        {sessions &&
          sessions.length > 0 &&
          sessions.map((session) => (
            <Col key={session.id} xs={24} md={isMobileDevice ? 24 : 12}>
              {isMobileDevice && (
                <Card hoverable className={styles.cardSmall} cover={<img alt="session" src={session.sessionImage} />}>
                  <Card.Meta
                    title={session.name}
                    description={
                      <>
                        <Text type="secondary">{session.sessionType}</Text>
                        <br />
                        {description(session)}
                      </>
                    }
                  />
                </Card>
              )}
              {!isMobileDevice && (
                <Card className={styles.card}>
                  <Row>
                    <Col>
                      <Image height={100} width={100} className={styles.cardImage} src={session.sessionImage} />
                    </Col>
                    <Col>
                      <div className={styles.wrapper}>
                        <Text type="secondary">{session.sessionType}</Text>
                        <Title className={styles.title} level={5}>
                          {session.name}
                        </Title>
                        {description(session)}
                      </div>
                    </Col>
                  </Row>
                </Card>
              )}
            </Col>
          ))}
      </Row>
    </Section>
  );
};
export default Sessions;
