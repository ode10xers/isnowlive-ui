import React from 'react';
import MobileDetect from 'mobile-detect';
import moment from 'moment';
import { Card, Image, Row, Col, Typography, Divider, Empty } from 'antd';

import Section from '../Section';
import { isValidImage } from 'utils/helper';

import styles from './style.module.scss';
const DefaultImage = require('assets/images/fallbackimage.png');

const { Text, Title } = Typography;

const Sessions = ({ sessions }) => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());

  const description = (session) => {
    return (
      <React.Fragment>
        <Text className={styles.day} strong>
          {moment(session.session_date).format('D').padStart(2, 0)}
        </Text>
        <Text strong> {moment(session.session_date).format('MMM')?.toUpperCase()} </Text>
        <Text type="secondary">
          {' '}
          <Divider type="vertical" /> {moment(session.start_time).format('LT')}
          {' -'}
        </Text>
        <Text type="secondary"> {moment(session.end_time).format('LT')} </Text>
      </React.Fragment>
    );
  };

  return (
    <Section>
      <Row>
        {sessions && sessions.length ? (
          sessions.map((session) => {
            return (
              <>
                {session.name && (
                  <Col key={session.id} xs={24} md={isMobileDevice ? 24 : 12}>
                    {isMobileDevice && (
                      <Card
                        hoverable
                        className={styles.cardSmall}
                        cover={
                          <img
                            alt="session"
                            src={isValidImage(session?.session_image_url) ? session.session_image_url : DefaultImage}
                          />
                        }
                      >
                        <Card.Meta
                          title={session.name}
                          description={
                            <React.Fragment>
                              <Text type="secondary">{session.group ? 'Group Session' : '1-to-1 Session'}</Text>
                              <br />
                              {session.session_date && description(session)}
                            </React.Fragment>
                          }
                        />
                      </Card>
                    )}
                    {!isMobileDevice && (
                      <Card className={styles.card}>
                        <Row>
                          <Col>
                            <Image
                              height={100}
                              width={100}
                              className={styles.cardImage}
                              src={isValidImage(session?.session_image_url) ? session.session_image_url : DefaultImage}
                            />
                          </Col>
                          <Col>
                            <div className={styles.wrapper}>
                              <Text type="secondary">{session.group ? 'Group Session' : '1-to-1 Session'}</Text>
                              <Title className={styles.title} level={5}>
                                {session.name}
                              </Title>
                              {session.session_date && description(session)}
                            </div>
                          </Col>
                        </Row>
                      </Card>
                    )}
                  </Col>
                )}
              </>
            );
          })
        ) : (
          <Col span={24}>
            <Empty description={false} />
          </Col>
        )}
      </Row>
    </Section>
  );
};
export default Sessions;
