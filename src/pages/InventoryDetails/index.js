import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, message, Typography } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import ReactHtmlParser from 'react-html-parser';

import Routes from 'routes';
import apis from 'apis';

import Share from 'components/Share';
import Loader from 'components/Loader';
import HostDetails from 'components/HostDetails';
import SessionDate from 'components/SessionDate';
import SessionInfo from 'components/SessionInfo';
import DefaultImage from 'components/Icons/DefaultImage';
import SessionRegistration from 'components/SessionRegistration';

import { isMobileDevice } from 'utils/device';
import { generateUrlFromUsername, isAPISuccess, reservedDomainName, isUnapprovedUserError } from 'utils/helper';
import dateUtil from 'utils/date';

import styles from './style.module.scss';

const { Title } = Typography;
const {
  formatDate: { getTimeDiff },
} = dateUtil;

const SoldOutImage = require('assets/images/sold_out.png');

const InventoryDetails = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [creator, setCreator] = useState(null);
  const [showDescription, setShowDescription] = useState(false);
  const [showPrerequisite, setShowPrerequisite] = useState(false);
  const [availablePasses, setAvailablePasses] = useState([]);

  const getDetails = useCallback(
    async (inventory_id) => {
      setIsLoading(true);
      try {
        const inventoryDetailsResponse = await apis.session.getPublicInventoryById(inventory_id);

        if (isAPISuccess(inventoryDetailsResponse.status) && inventoryDetailsResponse.data) {
          const inventoryDetails = inventoryDetailsResponse.data;

          setSession(inventoryDetails);

          const creatorUsername = inventoryDetails.creator_username || window.location.hostname.split('.')[0];

          const creatorDetailsResponse = await apis.user.getProfileByUsername(creatorUsername);
          if (isAPISuccess(creatorDetailsResponse.status) && creatorDetailsResponse.data) {
            setCreator(creatorDetailsResponse.data);
          } else {
            console.error('Failed to fetch creator of inventory', creatorDetailsResponse);
          }

          const passesResponse = await apis.passes.getPassesBySessionId(inventoryDetails?.session_id);

          if (isAPISuccess(passesResponse.status) && passesResponse.data) {
            setAvailablePasses(passesResponse.data);
          } else {
            console.error('Failed to fetch pass related to inventory', passesResponse);
          }
        } else {
          console.error('Failed to fetch inventoryDetails', inventoryDetailsResponse);
        }
      } catch (error) {
        if (!isUnapprovedUserError(error.response)) {
          message.error(error.response?.data?.message || 'Something went wrong.');
        }
        history.push(Routes.root);
      }
      setIsLoading(false);
    },
    //eslint-disable-next-line
    []
  );

  useEffect(() => {
    if (match.params.inventory_id) {
      const domainUsername = window.location.hostname.split('.')[0];
      if (domainUsername && !reservedDomainName.includes(domainUsername)) {
        getDetails(match.params.inventory_id);
      }
    } else {
      message.error('Session details not found.');
    }

    //eslint-disable-next-line
  }, [match.params.inventory_id]);

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      <Row justify="space-between" className={styles.mt50}>
        <Col span={24} className={classNames(styles.imageWrapper, styles.mb20)}>
          <img
            className={styles.coverImage}
            src={session?.session_image_url || DefaultImage()}
            alt="Session Detail"
            width="100%"
          />
          {session?.total_bookings >= session?.max_participants && (
            <div className={styles.darkOverlay}>
              <img className={styles.soldOutImage} src={SoldOutImage} alt="Sold out" />
            </div>
          )}
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
        {creator && (
          <Col xs={6} lg={{ span: 3, offset: 3 }}>
            <Share
              label="Share"
              shareUrl={`${generateUrlFromUsername(creator?.username)}/e/${session.inventory_id}`}
              title={`${session?.name} - ${creator?.first_name} ${creator?.last_name}`}
            />
          </Col>
        )}
      </Row>
      <Row justify="space-between" className={styles.mt50}>
        <Col xs={24} lg={15}>
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
          {session?.prerequisites && (
            <>
              <Title level={5} className={styles.mt50}>
                Session Prerequisite
              </Title>
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
            </>
          )}
        </Col>
        <Col xs={24} lg={{ span: 8, offset: 1 }} className={isMobileDevice ? styles.mt20 : styles.mt50}>
          <HostDetails host={creator} />
        </Col>
        <Col xs={24}>
          {session?.end_time &&
            !(session?.total_bookings >= session?.max_participants) &&
            getTimeDiff(session?.end_time, moment(), 'minutes') > 0 && (
              <SessionRegistration availablePasses={availablePasses} classDetails={session} isInventoryDetails={true} />
            )}
        </Col>
      </Row>
    </Loader>
  );
};

export default InventoryDetails;
