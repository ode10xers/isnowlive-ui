import React from 'react';
import ReactHtmlParser from 'react-html-parser';
import MobileDetect from 'mobile-detect';

import { Card, Image, Row, Col, Typography, Empty, Tag } from 'antd';

import { isValidFile, generateUrlFromUsername } from 'utils/helper';

import styles from './styles.module.scss';
const DefaultImage = require('assets/images/greybg.jpg');

const { Text, Title, Paragraph } = Typography;

const SessionCards = ({ sessions }) => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());

  const daysForSessions = ['Mon', 'Tue', 'Fri', 'Sat'];

  return (
    <div className={styles.box}>
      <Row>
        {sessions && sessions.length ? (
          <>
            {sessions.map((session) => (
              <Col span={24} key={session.id}>
                <Card hoverable className={styles.sessionCard} bodyStyle={{ padding: isMobileDevice ? 15 : 24 }}>
                  <Row gutter={16}>
                    <Col xs={24} md={8} lg={8}>
                      <Image
                        preview={false}
                        height={100}
                        className={styles.cardImage}
                        src={isValidFile(session?.session_image_url) ? session.session_image_url : DefaultImage}
                      />
                    </Col>
                    <Col xs={24} md={8} lg={12}>
                      <Row>
                        <Col xs={24} md={18}>
                          <Title level={5}>{session.name}</Title>
                        </Col>
                        <Col xs={24} md={6}>
                          <Tag color="cyan" className={styles.tags}>
                            {session.group ? 'Group Session' : '1-to-1 Session'}
                          </Tag>
                        </Col>
                        <Col xs={24}>
                          <Paragraph ellipsis={{ rows: 3 }}>{ReactHtmlParser(session?.description)}</Paragraph>
                        </Col>
                      </Row>
                    </Col>
                    <Col xs={24} md={8} lg={4}>
                      {/* For The Available Days */}
                      <Row gutter={[8, 8]}>
                        {daysForSessions.map((days) => (
                          <Col xs={12} md={8} key={days}>
                            <Tag color="blue" className={styles.tags}>
                              {days}
                            </Tag>
                          </Col>
                        ))}
                      </Row>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </>
        ) : (
          <Col span={24}>
            <Empty description={false} />
          </Col>
        )}
      </Row>
    </div>
  );
};

export default SessionCards;
