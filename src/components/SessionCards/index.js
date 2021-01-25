import React, { useState, useEffect } from 'react';
import ReactHtmlParser from 'react-html-parser';
import MobileDetect from 'mobile-detect';

import { Card, Image, Row, Col, Typography, Empty, Tag, message } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';

import dateUtil from 'utils/date';
import { isValidFile, isoDayOfWeek, generateUrlFromUsername } from 'utils/helper';

import styles from './styles.module.scss';
const DefaultImage = require('assets/images/greybg.jpg');

const { Title } = Typography;
const {
  formatDate: { getISODayOfWeek },
} = dateUtil;

const SessionCards = ({ sessions, shouldFetchInventories = false, username = null }) => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());

  const [adjustedSessions, setAdjustedSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const mapInventoryDays = (inventories) =>
    [...new Set(inventories.map((inventory) => getISODayOfWeek(inventory.start_time)))].sort();

  const getDaysForSession = async (sessionId) => {
    try {
      const { data } = await apis.session.getInventoriesForSession(sessionId);
      return mapInventoryDays(data.inventory);
    } catch (error) {
      message.error('Something wrong happened!');
    }
  };

  const adjustSession = async () => {
    setIsLoading(true);
    setAdjustedSessions(
      shouldFetchInventories
        ? await Promise.all(
            sessions.map(async (session) => ({
              ...session,
              inventory_days: await getDaysForSession(session.session_id),
            }))
          )
        : sessions.map((session) => ({
            ...session,
            inventory_days: mapInventoryDays(session.inventory),
          }))
    );

    setIsLoading(false);
  };

  const redirectToSessionsPage = (session) => {
    const baseUrl = generateUrlFromUsername(username || session.username || 'app');
    window.open(`${baseUrl}/s/${session.session_id}`);
  };

  useEffect(() => {
    adjustSession();
    //eslint-disable-next-line
  }, []);

  return (
    <div className={styles.box}>
      <Loader loading={isLoading} text="Fetching session informations">
        <Row>
          {adjustedSessions && adjustedSessions.length > 0 ? (
            <>
              {adjustedSessions.map((session) => (
                <Col span={24} key={session.session_id}>
                  <Card
                    className={styles.sessionCard}
                    bodyStyle={{ padding: isMobileDevice ? 15 : 24 }}
                    onClick={() => redirectToSessionsPage(session)}
                  >
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
                          <Col xs={24}>
                            <div className={styles.sessionDesc}>{ReactHtmlParser(session?.description)}</div>
                          </Col>
                        </Row>
                      </Col>
                      <Col xs={24} md={8} lg={6}>
                        <Row>
                          <Col xs={24}>
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
                          <Col xs={24} className={styles.alignBottom}>
                            <Tag color="cyan" className={styles.tags}>
                              {session.group ? 'Group Session' : '1-to-1 Session'}
                            </Tag>
                          </Col>
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
