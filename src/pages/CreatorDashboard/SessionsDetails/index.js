import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Row, Col, Typography, Button, Card, message, Popconfirm } from 'antd';
import {
  ArrowLeftOutlined,
  VideoCameraOutlined,
  EditOutlined,
  MailOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { useHistory } from 'react-router-dom';
import ReactHtmlParser from 'react-html-parser';

import apis from 'apis';
import dateUtil from 'utils/date';
import { generateUrlFromUsername, isAPISuccess, getDuration, copyPageLinkToClipboard } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';

import FileUpload from 'components/FileUpload';
import Section from 'components/Section';
import Loader from 'components/Loader';
import SessionDate from 'components/SessionDate';
import SessionInfo from 'components/SessionInfo';
import ParticipantsList from 'components/ParticipantsList';
import Share from 'components/Share';
import Routes from 'routes';

import {
  mixPanelEventTags,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';

import styles from './styles.module.scss';

const {
  formatDate: { toLongDateWithDay, getTimeDiff },
} = dateUtil;
const { Title, Text, Paragraph } = Typography;
const { creator } = mixPanelEventTags;

const SessionsDetails = ({ match }) => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [isPastSession, setIsPastSession] = useState(false);
  const [publicUrl, setPublicUrl] = useState(null);
  const [inventoryDocumentUrl, setInventoryDocumentUrl] = useState(null);

  const getInventoryDetails = useCallback(async (inventory_id) => {
    try {
      const { data } = await apis.session.getPrivateInventoryById(inventory_id);
      if (data) {
        setSession(data);
        if (data.document_url) {
          setInventoryDocumentUrl(data.document_url);
        }
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

  const trackAndNavigate = (destination, eventTag, newWindow = false, data = null) => {
    trackSimpleEvent(eventTag);

    if (newWindow) {
      window.open(destination);
    } else {
      if (data) {
        history.push(destination, { ...data });
      } else {
        history.push(destination);
      }
    }
  };

  const deleteInventory = async (inventory_id) => {
    const eventTag = creator.click.sessions.details.cancelSession;

    try {
      const { status } = await apis.session.delete(JSON.stringify([inventory_id]));
      if (isAPISuccess(status)) {
        trackSuccessEvent(eventTag, { inventory_id: inventory_id });
        history.push(Routes.creatorDashboard.rootPath);
      }
    } catch (error) {
      trackFailedEvent(eventTag, error, { inventory_id: inventory_id });
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  const isDisabled = session?.participants ? session?.participants.length > 0 : false;

  const handleDocumentUrlUpload = async (imageUrl) => {
    try {
      const { status } = await apis.session.updateSessionInventoryDocument(session.inventory_id, {
        document_url: imageUrl,
      });

      if (isAPISuccess(status)) {
        setInventoryDocumentUrl(imageUrl);
        setSession({ ...session, document_url: imageUrl });
      }
    } catch (error) {
      message.error('Failed to update session event document');
    }
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading session details">
      <Row gutter={8} justify="start" className={classNames(styles.mt20, styles.mb20)}>
        {isPastSession ? (
          <>
            <Col xs={24} md={10} lg={8}>
              <Button
                className={styles.headButton}
                onClick={() =>
                  trackAndNavigate(
                    '/creator/dashboard/sessions/past',
                    creator.click.sessions.details.backToPastSessionsList
                  )
                }
                icon={<ArrowLeftOutlined />}
              >
                Past Sessions
              </Button>
            </Col>
          </>
        ) : (
          <>
            <Col xs={24} md={10} lg={7} xl={5}>
              <Button
                className={styles.headButton}
                onClick={() =>
                  trackAndNavigate(
                    '/creator/dashboard/sessions/upcoming',
                    creator.click.sessions.details.backToUpcomingSessionsList
                  )
                }
                icon={<ArrowLeftOutlined />}
              >
                Upcoming Sessions
              </Button>
            </Col>
            <Col xs={24} md={7} lg={5} xl={4}>
              <Button
                className={styles.headButton}
                icon={<CopyOutlined />}
                onClick={() => copyPageLinkToClipboard(publicUrl)}
              >
                Copy Page Link
              </Button>
            </Col>
            <Col xs={24} md={7} lg={5} xl={4}>
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
                {layout('Session Price', `${session?.price} ${session?.currency.toUpperCase()} `)}
                {layout(
                  'Session Earning',
                  `${
                    session.participants
                      ? session.participants.reduce((item, participant) => item + (participant.fee_paid || 0), 0)
                      : 0
                  } ${session?.currency.toUpperCase()}`
                )}
              </Col>
            </>
          ) : (
            <>
              <Col span={24}>
                <Title>{session?.name}</Title>
              </Col>
              <Col xs={24} lg={18}>
                <SessionDate schedule={session} />
                <div className={styles.mt20}>
                  <SessionInfo session={session} />
                </div>
                <Row className={styles.mt10}>
                  <Col
                    xs={24}
                    lg={{
                      span: 8,
                      offset: session?.is_course ? 8 : 16,
                    }}
                  >
                    <FileUpload
                      name="inventory_document_url"
                      value={inventoryDocumentUrl}
                      onChange={handleDocumentUrlUpload}
                      listType="text"
                      label={inventoryDocumentUrl ? 'Change document' : 'Upload a PDF file'}
                      isEdit={Boolean(inventoryDocumentUrl)}
                    />
                    <Paragraph type="danger" className={styles.uploadHelpText}>
                      This will change the document for{' '}
                      <Text strong type="danger">
                        {' '}
                        THIS{' '}
                      </Text>{' '}
                      session only. To change the docs for all sessions click on the{' '}
                      <Text strong type="danger">
                        Edit Session
                      </Text>{' '}
                      button
                    </Paragraph>
                  </Col>
                </Row>
              </Col>
              <Col xs={24} lg={{ span: 5, offset: 1 }}>
                <Row gutter={[8, 8]}>
                  <Col xs={12} lg={24}>
                    <Button
                      size="large"
                      block
                      type="primary"
                      className={styles.actionButton}
                      icon={<VideoCameraOutlined />}
                      disabled={!session?.start_url}
                      onClick={() =>
                        trackAndNavigate(session?.start_url, creator.click.sessions.details.startSession, true)
                      }
                    >
                      Start Session
                    </Button>
                  </Col>
                  <Col xs={12} lg={24}>
                    <Button
                      size="large"
                      block
                      className={classNames(styles.actionButton, styles.editButton)}
                      icon={<EditOutlined />}
                      onClick={() =>
                        trackAndNavigate(
                          `${Routes.creatorDashboard.rootPath}/manage/session/${session?.session_id}/edit`,
                          creator.click.sessions.details.editSession,
                          false,
                          {
                            beginning: session.beginning,
                            expiry: session.expiry,
                          }
                        )
                      }
                    >
                      Edit Session
                    </Button>
                  </Col>
                  <Col xs={12} lg={24}>
                    <Button
                      size="large"
                      block
                      className={classNames(styles.actionButton, styles.emailButton)}
                      icon={<MailOutlined />}
                      onClick={() => {
                        trackSimpleEvent(creator.click.sessions.details.sendEmail);
                      }}
                    >
                      Send Email
                    </Button>
                  </Col>
                  <Col xs={12} lg={24}>
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
                </Row>
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
              currency={session?.currency.toUpperCase()}
              isPast={isPastSession}
            />
          </Col>
        </Row>
      </Section>
    </Loader>
  );
};

export default SessionsDetails;
