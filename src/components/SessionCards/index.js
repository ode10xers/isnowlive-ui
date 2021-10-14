import React, { useState, useEffect } from 'react';
import ReactHtmlParser from 'react-html-parser';

import { Card, Image, Row, Col, Typography, Empty, Tag } from 'antd';
import { BookTwoTone } from '@ant-design/icons';

import Loader from 'components/Loader';

import { isValidFile } from 'utils/helper';
import { isMobileDevice } from 'utils/device';
import { isoDayOfWeek } from 'utils/constants';
import { redirectToSessionsPage } from 'utils/redirect';
import { mapInventoryDays, getDaysForSession } from 'utils/session';

import styles from './styles.module.scss';
const DefaultImage = require('assets/images/greybg.jpg');

const { Title } = Typography;

/** @deprecated */
const SessionCards = ({ sessions, shouldFetchInventories = true, compactView = false }) => {
  const [adjustedSessions, setAdjustedSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    adjustSession();
    //eslint-disable-next-line
  }, [sessions]);

  return (
    <div className={styles.w100}>
      <Loader loading={isLoading} text="Fetching session informations">
        <Row gutter={[8, 8]}>
          {adjustedSessions && adjustedSessions.length > 0 ? (
            <>
              {adjustedSessions.map((session) => (
                <Col span={24} key={session.session_id}>
                  <Card
                    className={styles.sessionCard}
                    bodyStyle={{ padding: 16 }}
                    onClick={() => redirectToSessionsPage(session)}
                  >
                    {isMobileDevice || compactView ? (
                      <Row gutter={[8, 8]}>
                        <Col xs={24}>
                          <Image
                            loading="lazy"
                            preview={false}
                            // height={100}
                            className={styles.cardImage}
                            src={isValidFile(session?.session_image_url) ? session.session_image_url : DefaultImage}
                          />
                        </Col>
                        <Col xs={24}>
                          <Title ellipsis={{ rows: 1 }} level={5}>
                            {session.name} {session.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
                          </Title>
                        </Col>
                        <Col xs={24}>
                          <div className={styles.sessionDesc}>{ReactHtmlParser(session?.description)}</div>
                        </Col>
                        <Col xs={24}>
                          <Row gutter={[4]} justify="space-around">
                            {isoDayOfWeek.map((day, index) => (
                              <Col xs={3} key={`${session.session_id}_${day}`}>
                                <Tag
                                  className={
                                    session.inventory_days.includes(index + 1) ? styles.tags : styles.tagsDisabled
                                  }
                                  color={session.inventory_days.includes(index + 1) ? 'blue' : 'default'}
                                >
                                  {day[0]}
                                </Tag>
                              </Col>
                            ))}
                          </Row>
                        </Col>
                        <Col xs={24}>
                          <Tag color="cyan" className={styles.sessionTag}>
                            {session.group ? 'Group Session' : '1-to-1 Session'}
                          </Tag>
                        </Col>
                      </Row>
                    ) : (
                      <Row gutter={16}>
                        <Col xs={24} md={11}>
                          <Image
                            loading="lazy"
                            preview={false}
                            // height={136}
                            // width="100%"
                            className={styles.cardImage}
                            src={isValidFile(session?.session_image_url) ? session.session_image_url : DefaultImage}
                          />
                        </Col>
                        <Col xs={24} md={13} className={styles.cardDetailsContainer}>
                          <Row>
                            <Col xs={24}>
                              <Title ellipsis={{ rows: 1 }} level={5}>
                                {session.name} {session.is_course ? <BookTwoTone twoToneColor="#1890ff" /> : null}
                              </Title>
                            </Col>
                            <Col xs={24}>
                              <div className={styles.sessionDesc}>{ReactHtmlParser(session?.description)}</div>
                            </Col>
                          </Row>
                          <Row className={styles.tagsList}>
                            <Col xs={24} lg={21}>
                              {isoDayOfWeek.map((day, index) => (
                                <Tag
                                  key={`${session.session_id}_${day}`}
                                  className={
                                    session.inventory_days.includes(index + 1) ? styles.tags : styles.tagsDisabled
                                  }
                                  color={session.inventory_days.includes(index + 1) ? 'blue' : 'default'}
                                >
                                  {day}
                                </Tag>
                              ))}
                            </Col>
                            <Col xs={24} lg={3}>
                              <Tag color="cyan" className={styles.sessionTag}>
                                {session.group ? 'Group' : '1-on-1'}
                              </Tag>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    )}
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
