import React, { useState, useCallback, useEffect } from 'react';
import { Row, Col, Typography, Button, Tooltip } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { generateUrlFromUsername, getUsernameFromUrl } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { copyToClipboard } from 'utils/helper';
import apis from 'apis';
import Table from 'components/Table';
import { showErrorModal } from 'components/Modals/modals';
import { isAPISuccess, isUnapprovedUserError } from 'utils/helper';
import styles from './styles.module.scss';

const { Text, Title } = Typography;

const Referrals = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [courseOrders, setCourseOrders] = useState([]);

  const generateWidgetText = () => {
    var userNameValue = '';
    const username = userNameValue !== '' ? userNameValue : getLocalUserDetails()?.username || getUsernameFromUrl();
    const siteLink = generateUrlFromUsername(username);
    const referralCode = getLocalUserDetails().referral_code;

    return siteLink + '?ref=' + referralCode;
  };

  const generateUserName = () => {
    return getLocalUserDetails()?.username || getUsernameFromUrl();
  };

  const copyWidgetSnippet = () => copyToClipboard(generateWidgetText());

  const fetchUserCourseOrders = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.referrals.getCustomerRefData();

      if (isAPISuccess(status) && data) {
        setCourseOrders(data);
      }
    } catch (error) {
      if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Something wrong happened', error?.response?.data?.message || 'Failed to fetch course orders');
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUserCourseOrders();
  }, [fetchUserCourseOrders]);

  const courseColumns = [
    {
      title: 'Referred Person',
      key: 'name',
      dataIndex: 'name',
      render: (text, record) => {
        return {
          props: {
            style: {
              borderLeft: `6px solid ${record.color_code || '#FFF'}`,
            },
          },
          children: <Text> {record?.name} </Text>,
        };
      },
    },
    {
      title: 'Joining Date',
      key: 'date',
      dataIndex: 'date',
      width: '85px',
      render: (text, record) => {
        return {
          props: {
            style: {
              borderLeft: `6px solid ${record.color_code || '#FFF'}`,
            },
          },
          children: <Text> {record?.joining_date} </Text>,
        };
      },
    },
  ];

  return (
    <div className={styles.box}>
      <Title level={4}> Your Referral Section for {generateUserName()}'s site</Title>
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
            columns={courseColumns}
            data={courseOrders?.referrals}
            loading={isLoading}
            rowKey={(record) => record.id}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Referrals;
