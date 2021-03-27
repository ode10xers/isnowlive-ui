import React, { useState, useEffect } from 'react';
import { Row, Col, Empty, Button } from 'antd';
import { useTranslation } from 'react-i18next';

import SessionCards from 'components/SessionCards';

import { trackSimpleEvent, mixPanelEventTags } from 'services/integrations/mixpanel';

import styles from './style.module.scss';

const { user } = mixPanelEventTags;

const Sessions = ({ sessions, username }) => {
  const { t } = useTranslation();
  const [sessionCount, setSessionCount] = useState(6);
  const [reformattedSessions, setReformattedSessions] = useState([]);

  const showMore = () => {
    trackSimpleEvent(user.click.profile.showMore);
    if (sessionCount <= reformattedSessions.length) {
      setSessionCount(sessionCount + 6);
    }
  };

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
    <Row justify="space-around">
      {reformattedSessions && reformattedSessions.length ? (
        <>
          <SessionCards sessions={reformattedSessions.slice(0, sessionCount)} shouldFetchInventories={false} />
          {sessionCount < reformattedSessions.length && (
            <Col span={24} className={styles.textAlignCenter}>
              <Button type="primary" onClick={() => showMore()}>
                {t('SHOW_MORE')}
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
