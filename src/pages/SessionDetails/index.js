import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Image, message, Typography, Tabs } from 'antd';
import classNames from 'classnames';
import ReactHtmlParser from 'react-html-parser';

import Routes from 'routes';
import apis from 'apis';

import Share from 'components/Share';
import Loader from 'components/Loader';
import HostDetails from 'components/HostDetails';
import SessionInfo from 'components/SessionInfo';
import DefaultImage from 'components/Icons/DefaultImage';
import PublicVideoList from 'components/PublicVideoList';
import SessionRegistration from 'components/SessionRegistration';
import ShowcaseCourseCard from 'components/ShowcaseCourseCard';

import { isMobileDevice } from 'utils/device';
import {
  generateUrlFromUsername,
  isAPISuccess,
  reservedDomainName,
  isUnapprovedUserError,
  getUsernameFromUrl,
} from 'utils/helper';

import styles from './style.module.scss';

const { Title, Text } = Typography;

const SessionDetails = ({ match, history }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [creator, setCreator] = useState(null);
  const [courses, setCourses] = useState([]);
  const [showDescription, setShowDescription] = useState(false);
  const [showPrerequisite, setShowPrerequisite] = useState(false);
  const [availablePasses, setAvailablePasses] = useState([]);
  const [sessionVideos, setSessionVideos] = useState([]);

  const getDetails = useCallback(
    async (session_id) => {
      setIsLoading(true);
      try {
        const sessionDetailsResponse = await apis.session.getSessionDetails(session_id);

        if (isAPISuccess(sessionDetailsResponse.status) && sessionDetailsResponse.data) {
          const sessionDetails = sessionDetailsResponse.data;

          setSession({
            ...sessionDetails,
            inventory: sessionDetails.inventory.filter(
              (inventory) => inventory.num_participants < sessionDetails.max_participants
            ),
          });

          setSessionVideos(sessionDetails.Videos || []);

          const creatorUsername = sessionDetails.creator_username || getUsernameFromUrl();
          const creatorDetailsResponse = await apis.user.getProfileByUsername(creatorUsername);

          if (isAPISuccess(creatorDetailsResponse.status) && creatorDetailsResponse.data) {
            setCreator(creatorDetailsResponse.data);
          } else {
            console.error('Failed to fetch creator for session', creatorDetailsResponse);
          }

          if (sessionDetails.is_course) {
            const courseDetailsResponse = await apis.courses.getCoursesBySessionId(session_id);

            if (isAPISuccess(courseDetailsResponse.status) && courseDetailsResponse.data) {
              setCourses(courseDetailsResponse.data || []);
            } else {
              console.error('Failed to fetch courses for session', courseDetailsResponse);
            }
          }

          const passesResponse = await apis.passes.getPassesBySessionId(session_id);

          if (isAPISuccess(passesResponse.status) && passesResponse.data) {
            setAvailablePasses(passesResponse.data);
          } else {
            console.error('Failed to fetch pass data for session', passesResponse);
          }
        } else {
          console.error('Failed to fetch session data', sessionDetailsResponse);
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
    if (match.params.session_id) {
      const domainUsername = getUsernameFromUrl();

      if (domainUsername && !reservedDomainName.includes(domainUsername)) {
        getDetails(match.params.session_id);
      }
    } else {
      message.error('Session details not found.');
    }

    //eslint-disable-next-line
  }, [match.params.session_id]);

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      <Row justify="space-between" className={styles.mt50}>
        <Col span={24}>
          <Image
            preview={false}
            width={'100%'}
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
        {creator && (
          <Col xs={6} lg={{ span: 3, offset: 3 }}>
            <Share
              label="Share"
              shareUrl={`${generateUrlFromUsername(creator?.username)}/s/${session.session_id}`}
              title={`${session?.name} - ${creator?.first_name} ${creator?.last_name}`}
            />
          </Col>
        )}
      </Row>
      <Row justify="space-between" className={styles.mt50} gutter={16}>
        <Col xs={24} lg={14}>
          <Row>
            {session?.is_offline && (
              <Col xs={24}>
                <Title level={5}> Session Location </Title>
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
          {creator && <HostDetails host={creator} />}
        </Col>
      </Row>
      {session?.is_course && courses ? (
        courses?.length > 0 && (
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
        )
      ) : (
        <>
          <SessionRegistration availablePasses={availablePasses} classDetails={session} />
          {sessionVideos?.length > 0 && (
            <Row justify="space-between" className={styles.mt20}>
              <Col xs={24}>
                <div className={styles.box}>
                  <Tabs size="large" defaultActiveKey="Buy" activeKey="Buy">
                    <Tabs.TabPane key="Buy" tab="Buy Recorded Videos" className={styles.videoListContainer}>
                      <PublicVideoList videos={sessionVideos} />
                    </Tabs.TabPane>
                  </Tabs>
                </div>
              </Col>
            </Row>
          )}
        </>
      )}
    </Loader>
  );
};

export default SessionDetails;
