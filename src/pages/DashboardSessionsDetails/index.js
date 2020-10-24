import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Row, Col, Typography, Button, Card } from 'antd';
import {
  ArrowLeftOutlined,
  GlobalOutlined,
  ShareAltOutlined,
  VideoCameraOutlined,
  EditOutlined,
  MailOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import apis from 'apis';
import moment from 'moment';
import { useHistory } from 'react-router-dom';

import dateUtil from 'utils/date';
import Section from 'components/Section';
import Loader from 'components/Loader';
import SessionDate from 'components/SessionDate';
import SessionInfo from 'components/SessionInfo';
import ParticipantsList from 'components/ParticipantsList';

import styles from './styles.module.scss';

const {
  formatDate: { toLongDateWithDay },
} = dateUtil;
const { Title, Text } = Typography;

const DashboardSessionsDetails = ({ match }) => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [isPastSession, setIsPastSession] = useState(false);

  const getStaffSession = useCallback(async () => {
    const { data } = await apis.session.getSession();
    if (data) {
      const selectedData = data.reduce((item) => item.session.id === parseInt(match?.params?.session_id));
      setSession(selectedData);
      if (moment(selectedData?.inventory?.end_time).diff(moment(), 'days') < 0) {
        setIsPastSession(true);
      }
    }
    setIsLoading(false);
  }, [match.params.session_id]);

  useEffect(() => {
    if (match?.params?.session_id && match?.params?.inventory_id) {
      getStaffSession();
    }
  }, [match.params.session_id, match.params.inventory_id, getStaffSession]);

  const layout = (label, value) => (
    <Card>
      <Row>
        <Col span={12}>
          <Text strong>{label}</Text>
        </Col>
        <Col span={12}>{value}</Col>
      </Row>
    </Card>
  );

  return (
    <Loader loading={isLoading} size="large" text="Loading session details">
      <Row justify="start" className={classNames(styles.mt20, styles.mb20)}>
        {isPastSession ? (
          <>
            <Col xs={24} md={4}>
              <Button
                className={styles.headButton}
                onClick={() => history.push('/dashboard/sessions/past')}
                icon={<ArrowLeftOutlined />}
              >
                Past Sessions
              </Button>
            </Col>
          </>
        ) : (
          <>
            <Col xs={24} md={4}>
              <Button
                className={styles.headButton}
                onClick={() => history.push('/dashboard/sessions/upcoming')}
                icon={<ArrowLeftOutlined />}
              >
                Upcoming Sessions
              </Button>
            </Col>
            <Col xs={24} md={3}>
              <Button
                className={styles.headButton}
                onClick={() => history.push(`/sessions/${session?.session?.id}`)}
                icon={<GlobalOutlined />}
              >
                Public Page
              </Button>
            </Col>
            <Col xs={24} md={4}>
              <Button className={styles.headButton} icon={<ShareAltOutlined />}>
                Share Session
              </Button>
            </Col>
          </>
        )}
      </Row>
      <Section>
        <Row>
          {isPastSession ? (
            <>
              <Col span={24}>
                <Title level={5}>{session?.session?.name}</Title>
              </Col>
              <Col span={24}>
                <Title level={5}>Session Details</Title>
              </Col>
              <Col xs={24} md={12}>
                {layout('Session Date and Time', toLongDateWithDay(session?.inventory?.start_time))}
                {layout('Session Type', session?.session?.group ? 'Group Session' : '1-on-1 Session')}
                {layout('Session Duration', `${session?.session?.duration || 0} Minutes`)}
              </Col>
              <Col xs={24} md={12}>
                {layout(
                  'Session Attendees',
                  `${session?.participants?.length} / ${session?.session?.max_participants}`
                )}
                {layout('Session Price', `${session?.session?.currency} ${session?.session?.price}`)}
                {layout(
                  'Session Earning',
                  `${session?.session?.currency} ${session?.participants.reduce(
                    (item, participant) => item + (participant.fee_paid || 0),
                    0
                  )}`
                )}
              </Col>
            </>
          ) : (
            <>
              <Col span={24}>
                <Title>{session?.session?.name}</Title>
              </Col>
              <Col xs={24} md={18}>
                <SessionDate schedule={session?.session?.schedules[0]} />
                <div className={styles.mt20}>
                  <SessionInfo session={session?.session} />
                </div>
              </Col>
              <Col xs={24} md={4}>
                <Button
                  size="large"
                  block
                  type="primary"
                  className={styles.actionButton}
                  icon={<VideoCameraOutlined />}
                >
                  Start Session
                </Button>
                <Button
                  size="large"
                  block
                  className={classNames(styles.actionButton, styles.editButton)}
                  icon={<EditOutlined />}
                >
                  Edit Session
                </Button>
                <Button
                  size="large"
                  block
                  className={classNames(styles.actionButton, styles.emailButton)}
                  icon={<MailOutlined />}
                >
                  Send Email
                </Button>
                <Button
                  size="large"
                  block
                  type="primary"
                  danger
                  className={styles.actionButton}
                  icon={<CloseCircleOutlined />}
                >
                  Cancel Session
                </Button>
              </Col>

              <Col xs={24} md={18} className={styles.mt20}>
                <Title level={5}>Session Information</Title>
                <Text type="secondary" level={5}>
                  {session?.session?.description}
                </Text>
                <Title level={5} className={styles.mt50}>
                  Session Prerequisite
                </Title>
                <Text type="secondary" level={5}>
                  {session?.session?.prerequisites}
                </Text>
              </Col>
            </>
          )}
          <Col span={24} className={styles.mt20}>
            <ParticipantsList
              participants={session?.participants}
              currency={session?.session?.currency}
              isPast={isPastSession}
            />
          </Col>
        </Row>
      </Section>
    </Loader>
  );
};

export default DashboardSessionsDetails;
