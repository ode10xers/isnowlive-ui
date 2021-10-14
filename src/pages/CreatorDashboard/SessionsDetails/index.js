import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import ReactHtmlParser from 'react-html-parser';
import classNames from 'classnames';
import moment from 'moment';

import { Row, Col, Typography, Button, Card, message, Popconfirm, Space } from 'antd';
import {
  ArrowLeftOutlined,
  VideoCameraOutlined,
  EditOutlined,
  MailOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  CopyOutlined,
} from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Share from 'components/Share';
import Loader from 'components/Loader';
import Section from 'components/Section';
import SessionDate from 'components/SessionDate';
import SessionInfo from 'components/SessionInfo';
import ParticipantsList from 'components/ParticipantsList';
import EventAddressModal from 'components/EventAddressModal';
import InventoryDocumentEditor from './InventoryDocumentEditor';
import InventoryDescriptionEditor from './InventoryDescriptionEditor';

import dateUtil from 'utils/date';
import { getLocalUserDetails } from 'utils/storage';
import { generateUrlFromUsername } from 'utils/url';
import { isAPISuccess, getDuration, copyToClipboard, isValidFile } from 'utils/helper';

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

  const location = useLocation();
  const isAvailability = location.pathname.includes(Routes.creatorDashboard.availabilitiesDetails.split(':')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [isPastSession, setIsPastSession] = useState(false);
  const [publicUrl, setPublicUrl] = useState(null);
  const [isEditingDocuments, setIsEditingDocuments] = useState(false);
  const [offlineEventAddressModalVisible, setOfflineEventAddressModalVisible] = useState(false);

  const [isEditingDescription, setIsEditingDescription] = useState(false);

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

  const handleDocumentUrlUpload = async (documentUrls) => {
    try {
      const { status } = await apis.session.updateSessionInventory(session.inventory_id, {
        document_urls: documentUrls,
        description: session.description,
      });

      if (isAPISuccess(status)) {
        setSession({ ...session, document_urls: documentUrls });
        setIsEditingDocuments(false);
      }
    } catch (error) {
      message.error(`Failed to update ${isAvailability ? 'availability' : 'session'} event document`);
    }
  };

  const editInventoryDescription = async (updatedSessionDescription) => {
    try {
      const { status } = await apis.session.updateSessionInventory(session.inventory_id, {
        document_urls: session.document_urls,
        description: updatedSessionDescription,
      });

      if (isAPISuccess(status)) {
        setSession({ ...session, description: updatedSessionDescription });
        setIsEditingDescription(false);
      }
    } catch (error) {
      message.error(`Failed to update ${isAvailability ? 'availability' : 'session'} description`);
    }
  };

  const showEditOfflineEventAddressModal = () => {
    setOfflineEventAddressModalVisible(true);
  };

  const hideEditOfflineEventAddressModal = (shouldRefresh = false) => {
    setOfflineEventAddressModalVisible(false);

    if (shouldRefresh) {
      getInventoryDetails(match?.params?.inventory_id);
    }
  };

  return (
    <Loader loading={isLoading} size="large" text={`Loading ${isAvailability ? 'availability' : 'session'} details`}>
      <EventAddressModal
        visible={offlineEventAddressModalVisible}
        closeModal={hideEditOfflineEventAddressModal}
        inventory={session}
      />
      <Row gutter={8} justify="start" className={classNames(styles.mt20, styles.mb20)}>
        {isPastSession ? (
          <>
            <Col xs={24} md={10} lg={8}>
              <Button
                className={styles.headButton}
                onClick={() =>
                  trackAndNavigate(
                    `/creator/dashboard/${isAvailability ? 'availabilities' : 'sessions'}/past`,
                    creator.click.sessions.details.backToPastSessionsList
                  )
                }
                icon={<ArrowLeftOutlined />}
              >
                Past {isAvailability ? 'Availabilities' : 'Sessions'}
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
                    `/creator/dashboard/${isAvailability ? 'availabilities' : 'sessions'}/upcoming`,
                    creator.click.sessions.details.backToUpcomingSessionsList
                  )
                }
                icon={<ArrowLeftOutlined />}
              >
                Upcoming {isAvailability ? 'Availabilities' : 'Sessions'}
              </Button>
            </Col>
            <Col xs={24} md={7} lg={5} xl={4}>
              <Button className={styles.headButton} icon={<CopyOutlined />} onClick={() => copyToClipboard(publicUrl)}>
                Copy Page Link
              </Button>
            </Col>
            <Col xs={24} md={7} lg={5} xl={4}>
              <div className={styles.headButton}>
                <Share
                  label={`Share ${isAvailability ? 'Availability' : 'Session'}`}
                  title={session?.name}
                  shareUrl={publicUrl}
                />
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
                <Title level={5}>{isAvailability ? 'Availability' : 'Session'} Details</Title>
              </Col>
              <Col xs={24} md={12}>
                {layout(
                  `${isAvailability ? 'Availability' : 'Session'} Day and Date`,
                  toLongDateWithDay(session?.session_date)
                )}
                {layout(
                  `${isAvailability ? 'Availability' : 'Session'} Type`,
                  `${session?.group ? 'Group' : '1-on-1'} ${isAvailability ? 'Availability' : 'Session'}`
                )}
                {layout(
                  `${isAvailability ? 'Availability' : 'Session'} Duration`,
                  getDuration(session?.start_time, session?.end_time)
                )}
              </Col>
              <Col xs={24} md={12}>
                {layout(
                  `${isAvailability ? 'Availability' : 'Session'} Attendees`,
                  `${session?.num_participants} / ${session?.max_participants}`
                )}
                {layout(
                  `${isAvailability ? 'Availability' : 'Session'} Price`,
                  `${session?.price} ${session?.currency.toUpperCase()} `
                )}
                {layout(
                  `${isAvailability ? 'Availability' : 'Session'} Earning`,
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
                    {isEditingDocuments ? (
                      <InventoryDocumentEditor
                        sessionInventoryDocuments={
                          session?.document_urls?.filter((documentUrl) => documentUrl && isValidFile(documentUrl)) || []
                        }
                        onFinish={handleDocumentUrlUpload}
                        onCancel={() => setIsEditingDocuments(false)}
                      />
                    ) : (
                      <Button
                        disabled={isEditingDescription}
                        icon={<EditOutlined />}
                        onClick={() => setIsEditingDocuments(true)}
                      >
                        Change document
                      </Button>
                    )}

                    <Paragraph type="danger" className={styles.uploadHelpText}>
                      This will change the document for{' '}
                      <Text strong type="danger">
                        {' '}
                        THIS{' '}
                      </Text>{' '}
                      {isAvailability ? 'availability' : 'session'} only. To change the docs for all{' '}
                      {isAvailability ? 'availabilities' : 'sessions'} click on the{' '}
                      <Text strong type="danger">
                        Edit {isAvailability ? 'Availability' : 'Session'}
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
                      Start {isAvailability ? 'Availability' : 'Session'}
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
                          `${Routes.creatorDashboard.rootPath}/manage/${isAvailability ? 'availability' : 'session'}/${
                            session?.session_id
                          }/edit`,
                          creator.click.sessions.details.editSession,
                          false,
                          {
                            beginning: session.beginning,
                            expiry: session.expiry,
                          }
                        )
                      }
                    >
                      Edit {isAvailability ? 'Availability' : 'Session'}
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
                      title={`Do you want to cancel ${isAvailability ? 'availability' : 'session'}?`}
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
                        Cancel {isAvailability ? 'Availability' : 'Session'}
                      </Button>
                    </Popconfirm>
                  </Col>
                </Row>
              </Col>

              <Col xs={24} md={18} className={styles.mt20}>
                {session?.is_offline && (
                  <Space direction="vertical">
                    <Space align="start">
                      <Title level={5}>{isAvailability ? 'Availability' : 'Session'} Location</Title>
                      <Button
                        size="small"
                        type="link"
                        icon={<EditOutlined />}
                        disabled={isEditingDescription || isEditingDocuments}
                        onClick={showEditOfflineEventAddressModal}
                      >
                        Edit
                      </Button>
                    </Space>
                    <Text type="secondary" level={5}>
                      {session?.offline_event_address}
                    </Text>
                  </Space>
                )}
                <Title level={5} className={session?.is_offline ? styles.mt50 : undefined}>
                  {isAvailability ? 'Availability' : 'Session'} Description{' '}
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    disabled={isEditingDescription || isEditingDocuments}
                    onClick={() => setIsEditingDescription(true)}
                  >
                    {' '}
                    Edit{' '}
                  </Button>
                </Title>
                {isEditingDescription ? (
                  <InventoryDescriptionEditor
                    description={session?.description}
                    onFinish={editInventoryDescription}
                    onCancel={() => setIsEditingDescription(false)}
                  />
                ) : (
                  <Text type="secondary" level={5}>
                    {session?.description ? ReactHtmlParser(session?.description) : 'No description available'}
                  </Text>
                )}
                {session?.prerequisites && (
                  <>
                    <Title level={5} className={styles.mt50}>
                      {isAvailability ? 'Availability' : 'Session'} Prerequisite
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
