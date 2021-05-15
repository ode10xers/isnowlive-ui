import React, { useState, useCallback, useEffect } from 'react';
import { Row, Col, Typography, Button, Tooltip } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { getUsernameFromUrl } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import { atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { copyToClipboard } from 'utils/helper';
import apis from 'apis';
import Table from 'components/Table';
import { showErrorModal } from 'components/Modals/modals';
import { isAPISuccess, isUnapprovedUserError } from 'utils/helper';
import styles from './styles.module.scss';

const { Text, Title } = Typography;

const Referrals = () => {
  const [widgetLink, setWidgetLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [courseOrders, setCourseOrders] = useState([]);

  const generateWidgetText = () => {
    return 'Hellow World' + widgetLink;
  };

  const generateUserName = () => {
    return getLocalUserDetails()?.username || getUsernameFromUrl();
  };

  const copyWidgetSnippet = () => copyToClipboard(generateWidgetText());

  const fetchUserCourseOrders = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.referrals.getCustomerRefCode();

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

  const setWidgetLink2 = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.referrals.getCustomerRefData();

      if (isAPISuccess(status) && data) {
        setWidgetLink(data);
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
    setWidgetLink2();
  }, [fetchUserCourseOrders, setWidgetLink2]);

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
          children: <Text> {record?.course_name} </Text>,
        };
      },
    },
    {
      title: 'Joining Date',
      key: 'date',
      dataIndex: 'date',
      width: '85px',
      render: (text, record) => (record.price > 0 ? `${record.currency?.toUpperCase()} ${record.price}` : 'Free'),
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
            data={courseOrders?.active}
            loading={isLoading}
            rowKey={(record) => record.course_order_id}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Referrals;
