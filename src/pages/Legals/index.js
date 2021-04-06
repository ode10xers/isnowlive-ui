import React, { useState, useCallback, useEffect } from 'react';
import ReactHtmlParser from 'react-html-parser';

import { Row, Col, Typography, message } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';

import { isAPISuccess } from 'utils/helper';
import { generateDefaultText } from 'utils/legals';

import styles from './styles.module.scss';

const { Title } = Typography;

const creatorUsername = window.location.hostname.split('.')[0];

const Legals = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [creatorLegalsData, setCreatorLegalsData] = useState({
    creator: null,
    waiver: '',
    terms: '',
    refund_policy: '',
  });

  const getCreatorDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.user.getProfileByUsername(creatorUsername);
      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        return data;
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed fetching creator details');
    }
    setIsLoading(false);
    return null;
  }, []);

  const fetchCreatorLegalsData = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.legals.getLegalsByCreatorUsername(creatorUsername);
      if (isAPISuccess(status) && data) {
        setCreatorLegalsData(data);
      }
    } catch (error) {
      if (error?.response?.status === 500 && error?.response?.data?.message === 'no legal documents found for user') {
        // In the case where creator have not set it
        // We generate default T&C
        const creatorDetails = await getCreatorDetails();

        const creatorName = creatorDetails ? `${creatorDetails.first_name} ${creatorDetails.last_name}` : 'Creator';
        setCreatorLegalsData(generateDefaultText(creatorName));
      } else {
        message.error(error?.response?.data?.message || 'Failed to fetch terms and conditions for creator');
      }
    }

    setIsLoading(false);
  }, [getCreatorDetails]);

  useEffect(() => {
    fetchCreatorLegalsData();
  }, [fetchCreatorLegalsData]);

  return (
    <div className={styles.legalsPage}>
      <Loader loading={isLoading} text="Fetching creator's terms and conditinos">
        <Row gutter={[16, 16]}>
          {creatorLegalsData.waiver && (
            <Col xs={24}>
              <Title level={4}> Agreement of Release and Waiver of Liability </Title>
              <div>{ReactHtmlParser(creatorLegalsData.waiver)}</div>
            </Col>
          )}
          {creatorLegalsData.refund_policy && (
            <Col xs={24}>
              <Title level={4}> Agreement of Refund policy </Title>
              <div>{ReactHtmlParser(creatorLegalsData.refund_policy)}</div>
            </Col>
          )}
          {creatorLegalsData.terms && (
            <Col xs={24}>
              <Title level={4}> Agreement of Terms of Service </Title>
              <div>{ReactHtmlParser(creatorLegalsData.terms)}</div>
            </Col>
          )}
        </Row>
      </Loader>
    </div>
  );
};

export default Legals;
