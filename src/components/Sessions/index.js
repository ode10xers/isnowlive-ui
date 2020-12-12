import React from 'react';
import MobileDetect from 'mobile-detect';
import { Card, Image, Row, Col, Typography, Empty } from 'antd';

import { isValidFile, generateUrlFromUsername } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import dateUtil from 'utils/date';

import styles from './style.module.scss';
const DefaultImage = require('assets/images/fallbackimage.png');

const { Text, Title, Paragraph } = Typography;
const {
  formatDate: { toDate, toShortMonth, toDayOfWeek, toLocaleTime },
} = dateUtil;

const Sessions = ({ sessions, username }) => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());

  const eventSchedule = (session) => {
    return (
      <div className={styles.eventBoxWrap}>
        <Row>
          <Col xs={8} className={styles.eventBox}>
            <Text className={styles.text} strong>
              {toDate(session.session_date)}
            </Text>
            <Text className={styles.subtext} strong>
              {toShortMonth(session.session_date)?.toUpperCase()}
            </Text>
          </Col>
          <Col xs={16} className={styles.eventBox2}>
            <Text className={styles.text} strong>
              {toDayOfWeek(session.session_date)}
            </Text>
            <Text className={styles.subtext} strong>
              {toLocaleTime(session.start_time)}
              {' - '}
              {toLocaleTime(session.end_time)}
            </Text>
          </Col>
        </Row>
      </div>
    );
  };

  const showInventoryDetails = (inventory_id) => {
    const baseurl = generateUrlFromUsername(username || getLocalUserDetails().username);
    window.open(`${baseurl}/e/${inventory_id}`);
  };

  return (
    <div className={styles.box}>
      <Row>
        {sessions && sessions.length ? (
          sessions.map((session) => {
            return (
              <>
                {session.name && (
                  <Col key={session.id} xs={24}>
                    <Card
                      hoverable
                      className={styles.card}
                      onClick={() => showInventoryDetails(session.inventory_id)}
                      bodyStyle={{ padding: isMobileDevice ? 15 : 24 }}
                    >
                      <Row>
                        <Col>
                          <Image
                            height={100}
                            className={styles.cardImage}
                            src={isValidFile(session?.session_image_url) ? session.session_image_url : DefaultImage}
                          />
                        </Col>
                        <Col xs={24} md={10} lg={12}>
                          <div className={styles.wrapper}>
                            <Title className={styles.title} level={5}>
                              {session.name}
                            </Title>
                            <Paragraph ellipsis={{ rows: 3 }}>{session?.description}</Paragraph>
                          </div>
                        </Col>
                        <Col xs={24} md={4}>
                          <div className={styles.wrapper}>
                            {session.session_date && eventSchedule(session)}
                            <Text className={styles.sessionType} type="secondary">
                              {session.group ? 'Group Session' : '1-to-1 Session'}
                            </Text>
                          </div>
                        </Col>
                      </Row>
                    </Card>
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
    </div>
  );
};
export default Sessions;
