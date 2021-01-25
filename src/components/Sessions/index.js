import React, { useState, useEffect } from 'react';
import { Row, Col, Empty, Button } from 'antd';

import SessionCards from 'components/SessionCards';

import { trackSimpleEvent, mixPanelEventTags } from 'services/integrations/mixpanel';

import styles from './style.module.scss';

const { user } = mixPanelEventTags;

const Sessions = ({ sessions, username }) => {
  const [sessionCount, setSessionCount] = useState(4);
  const [reformattedSessions, setReformattedSessions] = useState([]);

  const showMore = () => {
    trackSimpleEvent(user.click.profile.showMore);
    if (sessionCount <= reformattedSessions.length) {
      setSessionCount(sessionCount + 4);
    }
  };

  // const eventSchedule = (session) => {
  //   return (
  //     <div className={styles.eventBoxWrap}>
  //       <Row>
  //         <Col xs={8} className={styles.eventBox}>
  //           <Text className={styles.text} strong>
  //             {toDate(session.start_time)}
  //           </Text>
  //           <Text className={styles.subtext} strong>
  //             {toShortMonth(session.start_time)?.toUpperCase()}
  //           </Text>
  //         </Col>
  //         <Col xs={16} className={styles.eventBox2}>
  //           <Text className={styles.text} strong>
  //             {toDayOfWeek(session.start_time)}
  //           </Text>
  //           <Text className={styles.subtext} strong>
  //             {toLocaleTime(session.start_time)}
  //             {' - '}
  //             {toLocaleTime(session.end_time)}
  //           </Text>
  //           <Text className={styles.subtext}>{getCurrentLongTimezone()}</Text>
  //         </Col>
  //       </Row>
  //     </div>
  //   );
  // };

  // const showInventoryDetails = (inventory_id) => {
  //   trackSimpleEvent(user.click.profile.sessionCard, { inventory_id: inventory_id });
  //   const baseurl = generateUrlFromUsername(username || getLocalUserDetails().username);
  //   window.open(`${baseurl}/e/${inventory_id}`);
  // };

  useEffect(() => {
    reformatSessions();
    //eslint-disable-next-line
  }, []);

  const reformatSessions = () => {
    let formattedSessions = [];

    sessions.forEach((inventory) => {
      const foundSessionIndex = formattedSessions.findIndex((val) => val.session_id === inventory.session_id);

      if (foundSessionIndex >= 0) {
        formattedSessions[foundSessionIndex].inventory.push(inventory);
      } else {
        formattedSessions.push({
          session_id: inventory.session_id,
          session_image_url: inventory.session_image_url,
          name: inventory.name,
          group: inventory.group,
          description: inventory.description,
          username: username,
          inventory: [inventory],
        });
      }
    });

    setReformattedSessions(formattedSessions);
  };

  return (
    <div className={styles.box}>
      <Row justify="space-around">
        {reformattedSessions && reformattedSessions.length ? (
          <>
            <SessionCards sessions={reformattedSessions.slice(0, sessionCount)} shouldFetchInventories={false} />
            {/* {reformattedSessions.slice(0, sessionCount).map((session) => (
              <div key={session.id}>
                {{session.name && (
                  <Col xs={24}>
                    <Card
                      hoverable
                      className={styles.card}
                      bodyStyle={{ padding: isMobileDevice ? 15 : 24 }}
                      onClick={() => showInventoryDetails(session.inventory_id)}
                    >
                      <Row>
                        <Col xs={24} md={8} lg={8}>
                          <Image
                            preview={false}
                            height={100}
                            className={styles.cardImage}
                            src={isValidFile(session?.session_image_url) ? session.session_image_url : DefaultImage}
                          />
                        </Col>
                        <Col xs={24} md={8} lg={10}>
                          <div className={styles.wrapper}>
                            <Title className={styles.title} level={5}>
                              {session.name}
                            </Title>
                            <div className={styles.sessionDesc}>{ReactHtmlParser(session?.description)}</div>
                          </div>
                        </Col>
                        <Col xs={24} md={8} lg={6}>
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
                )}}
              </div>
            ))} */}
            {sessionCount < reformattedSessions.length && (
              <Col span={24} className={styles.textAlignCenter}>
                <Button type="primary" onClick={() => showMore()}>
                  Show more
                </Button>
              </Col>
            )}
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
export default Sessions;
