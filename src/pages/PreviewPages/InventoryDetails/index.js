import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, message, Typography } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import ReactHtmlParser from 'react-html-parser';

import apis from 'apis';
import dummy from 'data/dummy';

import Loader from 'components/Loader';
import HostDetails from 'components/HostDetails';
import SessionDate from 'components/SessionDate';
import SessionInfo from 'components/SessionInfo';
import DefaultImage from 'components/Icons/DefaultImage';
import SessionRegistrationPreview from '../SessionRegistrationPreview';

import dateUtil from 'utils/date';
import { isAPISuccess } from 'utils/helper';
import { isMobileDevice } from 'utils/device';
import { getUsernameFromUrl } from 'utils/url';
import { reservedDomainName } from 'utils/constants';

import styles from './style.module.scss';

const { Title, Text } = Typography;
const {
  formatDate: { getTimeDiff },
} = dateUtil;

const InventoryDetailsPreview = ({ match, history }) => {
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
    if (match.params.inventory_id && creatorProfile) {
      const templateData = creatorProfile?.profile?.category ?? 'YOGA';

      const findInventoryMethod = (inv) => inv.inventory_id === parseInt(match.params.inventory_id);

      const targetSession = dummy[templateData].SESSIONS.find((sess) => sess.inventory.find(findInventoryMethod));
      if (targetSession) {
        const targetInventory = targetSession.inventory.find(findInventoryMethod);

        if (targetInventory) {
          setSession({ ...targetSession, ...targetInventory });
          fetchRelatedPassesForSession(targetSession.session_external_id, templateData);
        }
      } else {
        message.error('Invalid inventory ID');
      }
    }
    //eslint-disable-next-line
  }, [match.params.session_id, creatorProfile, fetchRelatedPassesForSession]);

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      <Row justify="space-between" className={styles.mt50}>
        <Col span={24} className={classNames(styles.imageWrapper, styles.mb20)}>
          <img
            loading="lazy"
            className={styles.coverImage}
            src={session?.session_image_url || DefaultImage()}
            alt="Session Detail"
            width="100%"
          />
        </Col>
        <Col xs={24} lg={14}>
          <Title level={isMobileDevice ? 2 : 1}>{session?.name}</Title>
        </Col>
        <Col xs={24} lg={10}>
          <SessionDate schedule={session} />
        </Col>
      </Row>
      <Row justify="space-between" className={styles.mt50}>
        <Col xs={18}>
          <SessionInfo session={session} />
        </Col>
      </Row>
      <Row justify="space-between" className={styles.mt50}>
        <Col xs={24} lg={15}>
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
        <Col xs={24} lg={{ span: 8, offset: 1 }} className={isMobileDevice ? styles.mt20 : undefined}>
          <HostDetails host={creatorProfile} />
        </Col>

        <Col xs={24}>
          {session?.end_time &&
            !(session?.total_bookings >= session?.max_participants) &&
            getTimeDiff(session?.end_time, moment(), 'minutes') > 0 && (
              <SessionRegistrationPreview
                availablePasses={availablePasses}
                classDetails={session}
                isInventoryDetails={true}
              />
            )}
        </Col>
      </Row>
    </Loader>
  );
};

export default InventoryDetailsPreview;
