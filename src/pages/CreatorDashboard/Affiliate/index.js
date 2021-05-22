import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Button, Typography, Collapse, Empty } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import apis from 'apis';
import dateUtil from 'utils/date';
import Loader from 'components/Loader';
import Table from 'components/Table';
import { showErrorModal } from 'components/Modals/modals';
import { isMobileDevice } from 'utils/device';
import { isAPISuccess } from 'utils/helper';
import styles from './styles.module.scss';
import classNames from 'classnames';
const {
  formatDate: { toLongDateWithDayTime },
} = dateUtil;

const { Title } = Typography;
const { Panel } = Collapse;

const Affiliate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [affiliateData, setRefData] = useState([]);

  const [expandedPublishedRowKeys, setExpandedPublishedRowKeys] = useState([]);
  const [expandedUnpublishedRowKeys, setExpandedUnpublishedRowKeys] = useState([]);

  const toggleExpandAllPublished = () => {
    if (expandedPublishedRowKeys.length > 0) {
      setExpandedPublishedRowKeys([]);
    } else {
      setExpandedPublishedRowKeys(affiliateData?.filter((affiliate) => affiliate).map((affiliate) => affiliate.id));
    }
  };

  const expandRowPublished = (rowKey) => {
    const tempExpandedRowsArray = expandedPublishedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedPublishedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRowPublished = (rowKey) =>
    setExpandedPublishedRowKeys(expandedPublishedRowKeys.filter((key) => key !== rowKey));

  const toggleExpandAllUnpublished = () => {
    if (expandedUnpublishedRowKeys.length > 0) {
      setExpandedUnpublishedRowKeys([]);
    } else {
      setExpandedUnpublishedRowKeys(affiliateData?.filter((affiliate) => !affiliate).map((affiliate) => affiliate.id));
    }
  };

  const expandRowUnpublished = (rowKey) => {
    const tempExpandedRowsArray = expandedUnpublishedRowKeys;
    tempExpandedRowsArray.push(rowKey);
    setExpandedUnpublishedRowKeys([...new Set(tempExpandedRowsArray)]);
  };

  const collapseRowUnpublished = (rowKey) =>
    setExpandedUnpublishedRowKeys(expandedUnpublishedRowKeys.filter((key) => key !== rowKey));

  const getReferenceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.referrals.getCreatorRefData();

      if (isAPISuccess(status) && data) {
        setRefData(data.attendees);
      }
    } catch (error) {
      showErrorModal('Failed fetching affiliate Data', error.response?.data?.message || 'Something went wrong');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    getReferenceData();
  }, [getReferenceData]);

  const generateAffiliateColumns = (published) => [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: published ? (
        <Button ghost type="primary" onClick={() => toggleExpandAllPublished()}>
          {expandedPublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
        </Button>
      ) : (
        <Button ghost type="primary" onClick={() => toggleExpandAllUnpublished()}>
          {expandedUnpublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
        </Button>
      ),
      align: 'right',
      width: '220px',
      render: (text, refRecord) => {
        const redemptionText = `${refRecord.referrals?.length || 0} Users`;

        return (
          <Row gutter={[8, 8]} justify="end">
            <Col xs={12}>
              {refRecord ? (
                expandedPublishedRowKeys.includes(refRecord.id) ? (
                  <Button block type="link" onClick={() => collapseRowPublished(refRecord.id)}>
                    {redemptionText} <UpOutlined />
                  </Button>
                ) : (
                  <Button block type="link" onClick={() => expandRowPublished(refRecord.id)}>
                    {redemptionText} <DownOutlined />
                  </Button>
                )
              ) : expandedUnpublishedRowKeys.includes(refRecord.id) ? (
                <Button block type="link" onClick={() => collapseRowUnpublished(refRecord.id)}>
                  {redemptionText} <UpOutlined />
                </Button>
              ) : (
                <Button block type="link" onClick={() => expandRowUnpublished(refRecord.id)}>
                  {redemptionText} <DownOutlined />
                </Button>
              )}
            </Col>
          </Row>
        );
      },
    },
  ];

  const redemptionColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Joining Date',
      dataIndex: 'joining_date',
      key: 'joining_date',
      render: (text) => toLongDateWithDayTime(text),
    },
  ];

  const renderRedemptionList = (record) => {
    return (
      <div className={classNames(styles.mb20, styles.mt20)}>
        <Table columns={redemptionColumns} data={record.referrals} rowKey={(record) => record.id} />
      </div>
    );
  };

  return (
    <div className={styles.box}>
      <Row gutter={[8, 8]}>
        <Col xs={12} md={14} lg={18}>
          <Title level={4}> Affiliates </Title>
        </Col>
        <Col xs={24}>
          <Collapse defaultActiveKey="Published">
            <Panel header={<Title level={5}> List of all Affiliates </Title>} key="Published">
              {affiliateData?.length ? (
                isMobileDevice ? (
                  <Loader loading={isLoading} size="large" text="Loading affiliateData">
                    <Row gutter={[8, 16]}>
                      <Col xs={24}>
                        <Button block ghost type="primary" onClick={() => toggleExpandAllPublished()}>
                          {expandedPublishedRowKeys.length > 0 ? 'Collapse' : 'Expand'} All
                        </Button>
                      </Col>
                    </Row>
                  </Loader>
                ) : (
                  <Table
                    sticky={true}
                    size="small"
                    columns={generateAffiliateColumns(true)}
                    data={affiliateData?.filter((affiliate) => affiliate)}
                    loading={isLoading}
                    rowKey={(record) => record.id}
                    expandable={{
                      expandedRowRender: renderRedemptionList,
                      expandRowByClick: true,
                      expandIconColumnIndex: -1,
                      expandedRowKeys: expandedPublishedRowKeys,
                    }}
                  />
                )
              ) : (
                <Empty description="No Data" />
              )}
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default Affiliate;
