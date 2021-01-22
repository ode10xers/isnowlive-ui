import React, { useState, useEffect } from 'react';
import ReactHtmlParser from 'react-html-parser';
import MobileDetect from 'mobile-detect';

import { Card, Image, Row, Col, Typography, Empty, Tag, message } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';

import dateUtil from 'utils/date';
import { isValidFile, isoDayOfWeek } from 'utils/helper';

import styles from './styles.module.scss';
const DefaultImage = require('assets/images/greybg.jpg');

const { Title, Paragraph } = Typography;
const {
  formatDate: { getISODayOfWeek },
} = dateUtil;

const SessionCards = ({ sessions }) => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());

  const [adjustedSessions, setAdjustedSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getDaysForSession = async (sessionId) => {
    try {
      const { data } = await apis.session.getInventoriesForSession(sessionId);
      return [...new Set(data.inventory.map((inventory) => getISODayOfWeek(inventory.start_time)))].sort();
    } catch (error) {
      // message.error('Failed fetching inventories for session ' + sessionId);
      message.error('Something wrong happened!');
    }
  };

  const adjustSession = async () => {
    setIsLoading(true);
    setAdjustedSessions(
      await Promise.all(
        sessions.map(async (session) => ({
          ...session,
          inventory_days: await getDaysForSession(session.session_id),
        }))
      )
    );
    setIsLoading(false);
  };

  useEffect(() => {
    adjustSession();
    //eslint-disable-next-line
  }, []);

  return (
    <div className={styles.box}>
      <Loader loading={isLoading} text="Fetching session informations">
        <Row>
          {adjustedSessions && adjustedSessions.length ? (
            <>
              {adjustedSessions.map((session) => (
                <Col span={24} key={session.session_id}>
                  <Card className={styles.sessionCard} bodyStyle={{ padding: isMobileDevice ? 15 : 24 }}>
                    <Row gutter={16}>
                      <Col xs={24} md={8} lg={8}>
                        <Image
                          preview={false}
                          height={100}
                          className={styles.cardImage}
                          src={isValidFile(session?.session_image_url) ? session.session_image_url : DefaultImage}
                        />
                      </Col>
                      <Col xs={24} md={8} lg={10}>
                        <Row>
                          <Col xs={24} md={16}>
                            <Title ellipsis={{ rows: 1 }} level={5}>
                              {session.name}
                            </Title>
                          </Col>
                          <Col xs={24} md={8}>
                            <Tag color="cyan" className={styles.tags}>
                              {session.group ? 'Group Session' : '1-to-1 Session'}
                            </Tag>
                          </Col>
                          <Col xs={24}>
                            <Paragraph ellipsis={{ rows: 3 }}>{ReactHtmlParser(session?.description)}</Paragraph>
                          </Col>
                        </Row>
                      </Col>
                      <Col xs={24} md={8} lg={6}>
                        {/* For The Available Days */}
                        <Row gutter={[8, 8]}>
                          {session.inventory_days.map((days) => (
                            <Col xs={12} md={8} key={`${session.session_id}_${days}`}>
                              <Tag color="blue" className={styles.tags}>
                                {isoDayOfWeek[days - 1]}
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
      </Loader>
    </div>
  );
};

export default SessionCards;
