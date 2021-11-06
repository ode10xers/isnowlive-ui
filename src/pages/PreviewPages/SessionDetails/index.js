import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Image, message, Typography } from 'antd';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';

import apis from 'apis';
import dummy from 'data/dummy';

import Loader from 'components/Loader';
import HostDetails from 'components/HostDetails';
import SessionInfo from 'components/SessionInfo';
import DefaultImage from 'components/Icons/DefaultImage';
import SessionRegistrationPreview from '../SessionRegistrationPreview';

import { isAPISuccess } from 'utils/helper';
import { isMobileDevice } from 'utils/device';
import { getUsernameFromUrl } from 'utils/url';
import { reservedDomainName } from 'utils/constants';

import styles from './style.module.scss';

const { Title, Text } = Typography;

const SessionDetailsPreview = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [showDescription, setShowDescription] = useState(false);
  const [showPrerequisite, setShowPrerequisite] = useState(false);
  const [availablePasses, setAvailablePasses] = useState([]);

  const fetchCreatorDetails = useCallback(async (creatorUsername) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.user.getProfileByUsername(creatorUsername);

      if (isAPISuccess(status) && data) {
        setCreatorProfile(data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to fetch creator profile');
    }

    setIsLoading(false);
  }, []);

  const fetchRelatedPassesForSession = useCallback(async (sessionExternalId, templateData = 'YOGA') => {
    const relatedPasses = dummy[templateData].PASSES.filter((pass) =>
      pass.sessions.find((session) => session.session_external_id === sessionExternalId)
    );
    setAvailablePasses(relatedPasses ?? []);
  }, []);

  useEffect(() => {
    const creatorUsername = getUsernameFromUrl();

    if (creatorUsername && !reservedDomainName.includes(creatorUsername)) {
      fetchCreatorDetails(creatorUsername);
    }
  }, [fetchCreatorDetails]);

  useEffect(() => {
    if (match.params.session_id && creatorProfile) {
      const templateData = creatorProfile?.profile?.category ?? 'YOGA';

      const targetSession = dummy[templateData].SESSIONS.find(
        (sess) => sess.session_id === parseInt(match.params.session_id)
      );
      if (targetSession) {
        setSession(targetSession);
        fetchRelatedPassesForSession(targetSession.session_external_id, templateData);
      } else {
        message.error('Invalid session ID');
      }
    }
    //eslint-disable-next-line
  }, [match.params.session_id, creatorProfile, fetchRelatedPassesForSession]);

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      <Row justify="space-between" className={styles.mt50}>
        <Col span={24}>
          <Image
            loading="lazy"
            preview={false}
            width="100%"
            className={classNames(styles.coverImage, styles.mb20)}
            src={session?.session_image_url || 'error'}
            fallback={DefaultImage()}
          />
        </Col>
        <Col xs={24}>
          <Title level={3}>{session?.name}</Title>
        </Col>
      </Row>
      <Row justify="space-between" className={styles.mt50}>
        <Col xs={18}>
          <SessionInfo session={session} />
        </Col>
      </Row>
      <Row justify="space-between" className={styles.mt50} gutter={16}>
        <Col xs={24} lg={14}>
          <Row>
            {session?.is_offline && (
              <Col xs={24}>
                <Title type="danger" level={5}>
                  This is an in-person event happening at :
                </Title>
                <Text> {session?.offline_event_address} </Text>
              </Col>
            )}
            <Col xs={24} className={session?.is_offline ? styles.mt50 : undefined}>
              <Title level={5}>Session Information</Title>
              {showDescription ? (
                <div className={styles.longTextExpanded}>{ReactHtmlParser(session?.description)}</div>
              ) : (
                <>
                  <div className={styles.sessionDesc}>{ReactHtmlParser(session?.description)}</div>
                  <div className={styles.readMoreText} onClick={() => setShowDescription(true)}>
                    Read More
                  </div>
                </>
              )}
            </Col>
            {session?.prerequisites && (
              <Col xs={24} className={styles.mt50}>
                <Title level={5}>Session Prerequisite</Title>
                {showPrerequisite ? (
                  <div className={styles.longTextExpanded}>{ReactHtmlParser(session?.prerequisites)}</div>
                ) : (
                  <>
                    <div className={styles.sessionPrereq}>{ReactHtmlParser(session?.prerequisites)}</div>
                    <div className={styles.readMoreText} onClick={() => setShowPrerequisite(true)}>
                      Read More
                    </div>
                  </>
                )}
              </Col>
            )}
          </Row>
        </Col>
        <Col xs={24} lg={{ span: 9, offset: 1 }} className={isMobileDevice ? styles.mt20 : undefined}>
          {creatorProfile && <HostDetails host={creatorProfile} />}
        </Col>
      </Row>
      <SessionRegistrationPreview availablePasses={availablePasses} classDetails={session} />
    </Loader>
  );
};

export default SessionDetailsPreview;
