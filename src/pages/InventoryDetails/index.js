import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Typography, Grid, message } from 'antd';
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
import ShowcaseCourseCard from 'components/ShowcaseCourseCard';
import SessionRegistration from 'components/SessionRegistration';

import dateUtil from 'utils/date';
import { reservedDomainName } from 'utils/constants';
import { isAPISuccess, isUnapprovedUserError } from 'utils/helper';
import { generateUrlFromUsername, getUsernameFromUrl } from 'utils/url';

import styles from './style.module.scss';
import SoldOutImage from 'assets/images/sold_out.png';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const {
  formatDate: { getTimeDiff },
} = dateUtil;

const InventoryDetails = ({ match, history }) => {
  const { lg } = useBreakpoint();

  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [creator, setCreator] = useState(null);
  const [courses, setCourses] = useState([]);
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

          const creatorUsername = inventoryDetails.creator_username || getUsernameFromUrl();

          const creatorDetailsResponse = await apis.user.getProfileByUsername(creatorUsername);
          if (isAPISuccess(creatorDetailsResponse.status) && creatorDetailsResponse.data) {
            setCreator(creatorDetailsResponse.data);
          } else {
            console.error('Failed to fetch creator of inventory', creatorDetailsResponse);
          }

          if (inventoryDetails.bundle_only) {
            const courseDetailsResponse = await apis.courses.getCoursesByInventoryId(
              inventoryDetails.inventory_external_id
            );

            if (isAPISuccess(courseDetailsResponse.status) && courseDetailsResponse.data) {
              setCourses(courseDetailsResponse.data || []);
            } else {
              console.error('Failed to fetch courses for session', courseDetailsResponse);
            }
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
      const domainUsername = getUsernameFromUrl();
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
            loading="lazy"
            className={styles.coverImage}
            src={session?.session_image_url || DefaultImage()}
            alt="Session Detail"
            width="100%"
          />
          {session?.total_bookings >= session?.max_participants && (
            <div className={styles.darkOverlay}>
              <img loading="lazy" className={styles.soldOutImage} src={SoldOutImage} alt="Sold out" />
            </div>
          )}
        </Col>
        <Col xs={24} lg={14}>
          <Title level={!lg ? 2 : 1}>{session?.name}</Title>
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
        <Col xs={24} lg={{ span: 8, offset: 1 }} className={!lg ? styles.mt20 : undefined}>
          <HostDetails host={creator} />
        </Col>
        {session?.bundle_only && courses ? (
          courses?.length > 0 && (
            <Col xs={24}>
              <div className={classNames(styles.mb50, styles.mt20)}>
                <Row gutter={[8, 16]}>
                  <Col xs={24}>
                    <Title level={5}> This session can only be attended by doing this course </Title>
                  </Col>
                  <Col xs={24}>
                    <ShowcaseCourseCard courses={courses} />
                  </Col>
                </Row>
              </div>
            </Col>
          )
        ) : (
          <Col xs={24}>
            {session?.end_time &&
              !(session?.total_bookings >= session?.max_participants) &&
              getTimeDiff(session?.end_time, moment(), 'minutes') > 0 && (
                <SessionRegistration
                  availablePasses={availablePasses}
                  classDetails={session}
                  isInventoryDetails={true}
                  isGiftEnabled={creator?.profile?.allow_gifting_products}
                />
              )}
          </Col>
        )}
      </Row>
    </Loader>
  );
};

export default InventoryDetails;
