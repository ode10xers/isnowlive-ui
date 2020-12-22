import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Row, Col, Typography, Button, Card, message, Popconfirm } from 'antd';
import {
  ArrowLeftOutlined,
  GlobalOutlined,
  VideoCameraOutlined,
  EditOutlined,
  MailOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { useHistory } from 'react-router-dom';
import ReactHtmlParser from 'react-html-parser';

import apis from 'apis';
import dateUtil from 'utils/date';
import { generateUrlFromUsername, isAPISuccess, getDuration } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import Section from 'components/Section';
import Loader from 'components/Loader';
import SessionDate from 'components/SessionDate';
import SessionInfo from 'components/SessionInfo';
import ParticipantsList from 'components/ParticipantsList';
import Share from 'components/Share';
import Routes from 'routes';

import { trackEventInMixPanel, mixPanelEventTags } from 'services/integrations/mixpanel';

import styles from './styles.module.scss';

const {
  formatDate: { toLongDateWithDay, getTimeDiff },
} = dateUtil;
const { Title, Text } = Typography;

const SessionsDetails = ({ match }) => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [isPastSession, setIsPastSession] = useState(false);
  const [publicUrl, setPublicUrl] = useState(null);

  const getInventoryDetails = useCallback(async (inventory_id) => {
    try {
      const { data } = await apis.session.getPrivateInventoryById(inventory_id);
      if (data) {
        setSession(data);
        if (getTimeDiff(data.end_time, moment(), 'days') < 0) {
          setIsPastSession(true);
        }
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  }, []);

  useEffect(() => {
    if (match?.params?.inventory_id) {
      getInventoryDetails(match?.params?.inventory_id);
      const username = getLocalUserDetails().username;
      const userProfilePath = generateUrlFromUsername(username);
      setPublicUrl(`${userProfilePath}/e/${match?.params?.inventory_id}`);
    }
  }, [match.params.inventory_id, getInventoryDetails]);

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

  const deleteInventory = async (inventory_id) => {
    try {
      const { status } = await apis.session.delete(JSON.stringify([inventory_id]));
      if (isAPISuccess(status)) {
        trackEventInMixPanel(mixPanelEventTags.creator.click.sessions.details.cancelSession, {
          result: 'SUCCESS',
          error_code: 'NA',
          error_message: 'NA',
          inventory_id: inventory_id,
        });
        history.push(Routes.creatorDashboard);
      }
    } catch (error) {
      trackEventInMixPanel(mixPanelEventTags.creator.click.sessions.details.cancelSession, {
        result: 'FAILED',
        error_code: error.response?.data?.code,
        error_message: error.response?.data?.message,
        inventory_id: inventory_id,
      });
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  const isDisabled = session?.participants ? session?.participants.length > 0 : false;

  return (
    <Loader loading={isLoading} size="large" text="Loading session details">
      <Row justify="start" className={classNames(styles.mt20, styles.mb20)}>
        {isPastSession ? (
          <>
            <Col xs={24} md={4}>
              <Button
                className={styles.headButton}
                onClick={() => {
                  trackEventInMixPanel(mixPanelEventTags.creator.click.sessions.details.backToPastSessionsList);
                  history.push('/creator/dashboard/sessions/past');
                }}
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
                onClick={() => {
                  trackEventInMixPanel(mixPanelEventTags.creator.click.sessions.details.backToUpcomingSessionsList);
                  history.push('/creator/dashboard/sessions/upcoming');
                }}
                icon={<ArrowLeftOutlined />}
              >
                Upcoming Sessions
              </Button>
            </Col>
            <Col xs={24} md={3}>
              <Button
                className={styles.headButton}
                icon={<GlobalOutlined />}
                onClick={() => {
                  trackEventInMixPanel(mixPanelEventTags.creator.click.sessions.details.publicPage);
                  window.open(publicUrl);
                }}
              >
                Public Page
              </Button>
            </Col>
            <Col xs={24} md={4}>
              <div className={styles.headButton}>
                <Share label="Share Session" title={session?.name} shareUrl={publicUrl} />
              </div>
            </Col>
          </>
        )}
      </Row>
      <Section>
        <Row>
          {isPastSession ? (
            <>
              <Col span={24}>
                <Title level={5}>{session?.name}</Title>
              </Col>
              <Col span={24}>
                <Title level={5}>Session Details</Title>
              </Col>
              <Col xs={24} md={12}>
                {layout('Session Day and Date', toLongDateWithDay(session?.session_date))}
                {layout('Session Type', session?.group ? 'Group Session' : '1-on-1 Session')}
                {layout('Session Duration', getDuration(session?.start_time, session?.end_time))}
              </Col>
              <Col xs={24} md={12}>
                {layout('Session Attendees', `${session?.num_participants} / ${session?.max_participants}`)}
                {layout('Session Price', `${session?.price} ${session?.currency} `)}
                {layout(
                  'Session Earning',
                  `${
                    session.participants
                      ? session.participants.reduce((item, participant) => item + (participant.fee_paid || 0), 0)
                      : 0
                  } ${session?.currency}`
                )}
              </Col>
            </>
          ) : (
            <>
              <Col span={24}>
                <Title>{session?.name}</Title>
              </Col>
              <Col xs={24} md={18}>
                <SessionDate schedule={session} />
                <div className={styles.mt20}>
                  <SessionInfo session={session} />
                </div>
              </Col>
              <Col xs={24} md={4}>
                <Button
                  size="large"
                  block
                  type="primary"
                  className={styles.actionButton}
                  icon={<VideoCameraOutlined />}
                  disabled={!session?.start_url}
                  onClick={() => {
                    trackEventInMixPanel(mixPanelEventTags.creator.click.sessions.details.startSession, {
                      session_id: session?.session_id,
                      inventory_id: session?.inventory_id,
                    });
                    window.open(session?.start_url);
                  }}
                >
                  Start Session
                </Button>
                <Button
                  size="large"
                  block
                  className={classNames(styles.actionButton, styles.editButton)}
                  icon={<EditOutlined />}
                  onClick={() => {
                    trackEventInMixPanel(mixPanelEventTags.creator.click.sessions.details.editSession, {
                      session_id: session?.session_id,
                      inventory_id: session?.inventory_id,
                    });
                    history.push(`${Routes.creatorDashboard.rootPath}/manage/session/${session?.session_id}/edit`);
                  }}
                >
                  Edit Session
                </Button>
                <Button
                  size="large"
                  block
                  className={classNames(styles.actionButton, styles.emailButton)}
                  icon={<MailOutlined />}
                  onClick={() => {
                    trackEventInMixPanel(mixPanelEventTags.creator.click.sessions.details.sendEmail, {
                      session_id: session?.session_id,
                      inventory_id: session?.inventory_id,
                    });
                  }}
                >
                  Send Email
                </Button>
                <Popconfirm
                  title="Do you want to cancel session?"
                  icon={<DeleteOutlined className={styles.danger} />}
                  okText="Yes"
                  cancelText="No"
                  disabled={isDisabled}
                  onConfirm={() => deleteInventory(session?.inventory_id)}
                >
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
                </Popconfirm>
              </Col>

              <Col xs={24} md={18} className={styles.mt20}>
                {session?.description && (
                  <>
                    <Title level={5}>Session Information</Title>
                    <Text type="secondary" level={5}>
                      {ReactHtmlParser(session?.description)}
                    </Text>
                  </>
                )}
                {session?.prerequisites && (
                  <>
                    <Title level={5} className={styles.mt50}>
                      Session Prerequisite
                    </Title>
                    <Text type="secondary" level={5}>
                      {ReactHtmlParser(session?.prerequisites)}
                    </Text>
                  </>
                )}
              </Col>
            </>
          )}
          <Col span={24} className={styles.mt20}>
            <ParticipantsList
              participants={session?.participants}
              currency={session?.currency}
              isPast={isPastSession}
            />
          </Col>
        </Row>
      </Section>
    </Loader>
  );
};

export default SessionsDetails;
