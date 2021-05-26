import React, { useState, useCallback, useEffect } from 'react';
import { Row, Col, Typography, Button, Tooltip } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { generateUrlFromUsername, getUsernameFromUrl } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { copyToClipboard } from 'utils/helper';
import apis from 'apis';
import dateUtil from 'utils/date';
import Table from 'components/Table';
import { showErrorModal } from 'components/Modals/modals';
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
    const username = getUsernameFromUrl();
    const siteLink = generateUrlFromUsername(username);
    const referralCode = getLocalUserDetails().referral_code;

    return siteLink + '?ref=' + referralCode;
  };

  const copyWidgetSnippet = () => copyToClipboard(generateWidgetText());

  const fetchCreatorAffiliateData = useCallback(async () => {
    setIsLoading(true);

    try {
      // TODO: Adjust this when the contract is confirmed
      const { status, data } = await apis.referrals.getCustomerRefData();

      if (isAPISuccess(status) && data) {
        setCreatorAffiliateData(data);
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

  // TODO: Also adjust the columns when the data is confirmed
  const referenceColumns = [
    {
      title: 'Referred Person',
      key: 'name',
      dataIndex: 'name',
    },
    {
      title: 'Joining Date',
      key: 'date',
      dataIndex: 'date',
      render: (text) => toLongDateWithDayTime(text),
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
            data={creatorAffiliateData?.referrals}
            loading={isLoading}
            rowKey={(record) => record.id}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Affiliates;
