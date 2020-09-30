import React from 'react';
import { Card, Image, Row, Col, Typography } from 'antd';
import Section from '../Section';
import MobileDetect from 'mobile-detect';
import styles from './style.module.scss';
import moment from 'moment';

const Sessions = ({ sessions }) => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());

  return (
    <Section>
      <Row>
        {sessions && sessions.length
          ? sessions.map((session) => (
              <Col key={session.id} xs={24} md={isMobileDevice ? 24 : 12}>
                <Card className={isMobileDevice ? styles.cardSmall : styles.card}>
                  <Row>
                    <Col>
                      <Image
                        height={isMobileDevice ? 80 : 100}
                        width={isMobileDevice ? 80 : 100}
                        className={styles.cardImage}
                        src={session.sessionImage}
                      />
                    </Col>
                    <Col>
                      <div className={styles.wrapper}>
                        <Typography.Text type="secondary">{session.sessionType}</Typography.Text>
                        <Typography.Title className={styles.title} level={5}>
                          {session.name}
                        </Typography.Title>
                        <Typography.Text className={styles.day} strong>
                          {moment(session.date).format('D')}
                        </Typography.Text>
                        <Typography.Text strong> {moment(session.date).format('MMM')?.toUpperCase()} </Typography.Text>
                        <Typography.Text type="secondary">
                          {' '}
                          {'|'} {moment(session.starttime).format('LT')}
                          {' -'}
                        </Typography.Text>
                        <Typography.Text type="secondary"> {moment(session.endtime).format('LT')} </Typography.Text>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))
          : null}
      </Row>
    </Section>
  );
};
export default Sessions;
