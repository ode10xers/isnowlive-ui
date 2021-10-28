import React, { useState, useCallback, useEffect } from 'react';
import { atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import SyntaxHighlighter from 'react-syntax-highlighter';

import { Row, Col, Typography, Button, Tooltip } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

import apis from 'apis';

import Table from 'components/Table';
import { showErrorModal } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { copyToClipboard } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import { isAPISuccess, isUnapprovedUserError } from 'utils/helper';

import styles from './styles.module.scss';

const {
  formatDate: { toLongDateWithDayTime },
} = dateUtil;

const { Title } = Typography;

const Affiliates = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [creatorAffiliateData, setCreatorAffiliateData] = useState([]);

  const generateWidgetText = () => {
    // const username = getUsernameFromUrl();
    // const siteLink = generateUrlFromUsername(username);
    const referralCode = getLocalUserDetails().referral_code;

    // Since this is for referring other creators, we'll direct them to marketing site
    return 'https://passion.do?invite=' + referralCode;
  };

  const copyWidgetSnippet = () => copyToClipboard(generateWidgetText());

  const fetchCreatorAffiliateData = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.referrals.getCreatorAffiliatesData();

      if (isAPISuccess(status) && data) {
        setCreatorAffiliateData(data.creators);
      }
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        showErrorModal(
          'Something wrong happened',
          error?.response?.data?.message || 'Failed to fetch Creator Referrals Data'
        );
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorAffiliateData();
  }, [fetchCreatorAffiliateData]);

  const referenceColumns = [
    {
      title: 'Referred Person',
      key: 'name',
      dataIndex: 'name',
    },
    {
      title: 'Joining Date',
      key: 'joining_date',
      dataIndex: 'joining_date',
      width: '200px',
      render: (text) => toLongDateWithDayTime(text),
    },
    {
      title: 'Month 1 Revenue',
      width: '200px',
      render: (record, text) => `Your earnings from 1st month will be shown here`,
    },
    {
      title: 'Month 2 Revenue',
      width: '200px',
      render: (record, text) => `Your earnings from 2nd month will be shown here`,
    },
    {
      title: 'Month 3 Revenue',
      width: '200px',
      render: (record, text) => `Your earnings from 3rd month will be shown here`,
    },
  ];

  return (
    <div className={styles.box}>
      <Title level={4}> Your Referral Section </Title>
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <div>
            <h4>Your referral code for this site</h4>
            <SyntaxHighlighter
              wrapLongLines={true}
              language="htmlbars"
              style={atomOneLight}
              className={styles.codeSnippetContainer}
            >
              {generateWidgetText()}
            </SyntaxHighlighter>
            <div className={styles.copySnippetBtnContainer}>
              <Tooltip title="Copy code snippet" trigger="hover">
                <Button ghost type="primary" onClick={() => copyWidgetSnippet()} icon={<CopyOutlined />} />
              </Tooltip>
            </div>
          </div>
        </Col>
        <Col xs={24}>
          <Table
            columns={referenceColumns}
            data={creatorAffiliateData}
            loading={isLoading}
            rowKey={(record) => record.id}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Affiliates;
