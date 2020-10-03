import React from 'react';
import { Card, Image, Row, Col, Typography, Divider } from 'antd';
import Section from '../Section';
import MobileDetect from 'mobile-detect';
import styles from './style.module.scss';
import moment from 'moment';

const Sessions = ({ sessions }) => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());

  const description = (session) => {
    return (
      <>
        <Typography.Text className={styles.day} strong>
          {moment(session.date).format('D').padStart(2, 0)}
        </Typography.Text>
        <Typography.Text strong> {moment(session.date).format('MMM')?.toUpperCase()} </Typography.Text>
        <Typography.Text type="secondary">
          {' '}
          <Divider type="vertical" /> {moment(session.starttime).format('LT')}
          {' -'}
        </Typography.Text>
        <Typography.Text type="secondary"> {moment(session.endtime).format('LT')} </Typography.Text>
      </>
    );
  };

  return (
    <Section>
      <Row>
        {sessions && sessions.length
          ? sessions.map((session) => (
              <Col key={session.id} xs={24} md={isMobileDevice ? 24 : 12}>
                {isMobileDevice ? (
                  <Card hoverable className={styles.cardSmall} cover={<img alt="session" src={session.sessionImage} />}>
                    <Card.Meta
                      title={session.name}
                      description={
                        <>
                          <Typography.Text type="secondary">{session.sessionType}</Typography.Text>
                          <br />
                          {description(session)}
                        </>
                      }
                    />
                  </Card>
                ) : (
                  <Card className={styles.card}>
                    <Row>
                      <Col>
                        <Image height={100} width={100} className={styles.cardImage} src={session.sessionImage} />
                      </Col>
                      <Col>
                        <div className={styles.wrapper}>
                          <Typography.Text type="secondary">{session.sessionType}</Typography.Text>
                          <Typography.Title className={styles.title} level={5}>
                            {session.name}
                          </Typography.Title>
                          {description(session)}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                )}
              </Col>
            ))
          : null}
      </Row>
    </Section>
  );
};
export default Sessions;
