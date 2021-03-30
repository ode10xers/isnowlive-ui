import React, { useState, useEffect, useCallback, useMemo } from 'react';
import classNames from 'classnames';
import { Row, Col, Empty, Button } from 'antd';

import SessionCards from 'components/SessionCards';

import { trackSimpleEvent, mixPanelEventTags } from 'services/integrations/mixpanel';

import styles from './style.module.scss';

const { user } = mixPanelEventTags;

const Sessions = ({ sessions, username }) => {
  const [sessionCount, setSessionCount] = useState(6);
  const [reformattedSessions, setReformattedSessions] = useState([]);

  const showMore = () => {
    trackSimpleEvent(user.click.profile.showMore);
    if (sessionCount <= reformattedSessions.length) {
      const newSessionCount = sessionCount + 6;
      setSessionCount(newSessionCount);
    }
  };

  const reformatSessions = useCallback(() => {
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

    console.log(formattedSessions);
    setReformattedSessions(formattedSessions);
  }, [sessions, username]);

  useEffect(() => {
    reformatSessions();
  }, [reformatSessions]);

  const shownSessions = useMemo(() => reformattedSessions.slice(0, sessionCount), [reformattedSessions, sessionCount]);

  return (
    <Row justify="space-around">
      {reformattedSessions && reformattedSessions.length ? (
        <>
          <SessionCards sessions={shownSessions} shouldFetchInventories={false} />
          {sessionCount < reformattedSessions.length && (
            <Col span={24} className={classNames(styles.textAlignCenter, styles.mb50)}>
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
  );
};
export default Sessions;
