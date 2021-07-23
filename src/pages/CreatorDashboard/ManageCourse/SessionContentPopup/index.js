import React, { useState, useEffect, useCallback, useMemo } from 'react';
import moment from 'moment';

import { Row, Col, Button, Modal, Collapse, Typography, Spin, Space, DatePicker } from 'antd';
import { DownOutlined, CheckCircleFilled } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import Table from 'components/Table';
import { showErrorModal, resetBodyStyle } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { isAPISuccess, preventDefaults, getDuration } from 'utils/helper';

import styles from './styles.module.scss';

const { Panel } = Collapse;
const { Title, Text } = Typography;

const {
  formatDate: { toLongDateWithLongDay, toLocaleTime },
  timeCalculation: { dateIsBeforeDate },
} = dateUtil;

const SessionContentPopup = ({
  visible,
  closeModal,
  addContentMethod = null,
  courseStartDate = null,
  courseEndDate = null,
  changeCourseDates,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [inventories, setInventories] = useState([]);
  const [expandedAccordionKeys, setExpandedAccordionKeys] = useState([]);
  const [selectedSessionPopupContent, setSelectedSessionPopupContent] = useState([]);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchCreatorUpcomingSessionInventories = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.session.getUpcomingSession();

      if (isAPISuccess(status) && data) {
        setInventories(data);
      }
    } catch (error) {
      showErrorModal('Failed to fetch course classes', error?.response?.data?.message || 'Something went wrong');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (visible) {
      fetchCreatorUpcomingSessionInventories();
    }
  }, [visible, fetchCreatorUpcomingSessionInventories]);

  useEffect(() => {
    if (courseStartDate) {
      setStartDate(courseStartDate);
    }

    if (courseEndDate) {
      setEndDate(courseEndDate);
    }
  }, [courseStartDate, courseEndDate]);

  //#region Start of Button Handlers

  const handleCloseModal = () => {
    setExpandedAccordionKeys([]);
    closeModal();
  };

  const handleMarkInventoryAsSelected = (inventoryExternalId) => {
    setIsLoading(true);
    setSelectedSessionPopupContent([...new Set([...selectedSessionPopupContent, inventoryExternalId])]);
    setIsLoading(false);
  };

  const handleUnmarkInventoryAsSelected = (inventoryExternalId) => {
    setIsLoading(true);
    setSelectedSessionPopupContent(selectedSessionPopupContent.filter((val) => val !== inventoryExternalId));
    setIsLoading(false);
  };

  const handleCreateNewSessionClicked = (e) => {
    preventDefaults(e);

    handleCloseModal();

    window.open(
      `${window.location.origin}${Routes.creatorDashboard.rootPath}${Routes.creatorDashboard.createSessions}`,
      '_blank'
    );
  };

  //#endregion End of Button Handlers

  //#region Start of UI Constants

  const sessionPopupColumns = [
    {
      title: 'Session Date',
      dataIndex: 'inventory_external_id',
      key: 'inventory_external_id',
      render: (text, record) => toLongDateWithLongDay(record.start_time),
    },
    {
      title: 'Time',
      dataIndex: 'inventory_external_id',
      key: 'inventory_external_id',
      width: '180px',
      render: (text, record) => `${toLocaleTime(record.start_time)} - ${toLocaleTime(record.end_time)} `,
    },
    {
      title: 'Duration',
      dataIndex: 'inventory_external_id',
      key: 'inventory_external_id',
      width: '90px',
      render: (text, record) => getDuration(record.start_time, record.end_time),
    },
    {
      title: 'Action',
      width: '180px',
      render: (record) =>
        selectedSessionPopupContent.includes(record.inventory_external_id) ? (
          <Button
            ghost
            type="primary"
            icon={<CheckCircleFilled className={styles.blueText} />}
            onClick={() => handleUnmarkInventoryAsSelected(record.inventory_external_id)}
          >
            Selected
          </Button>
        ) : (
          <Button ghost type="primary" onClick={() => handleMarkInventoryAsSelected(record.inventory_external_id)}>
            Select this session
          </Button>
        ),
    },
  ];

  // NOTE : this is affected by the props, not the state
  const inventoryListFilteredByCourseDate = useMemo(() => {
    if (!courseStartDate || !courseEndDate) {
      return inventories ?? [];
    }

    return (
      inventories?.filter(
        (inventory) =>
          moment(inventory.start_time).isSameOrAfter(moment(courseStartDate).startOf('day')) &&
          moment(inventory.end_time).isSameOrBefore(moment(courseEndDate).endOf('day'))
      ) ?? []
    );
  }, [inventories, courseStartDate, courseEndDate]);

  //#endregion End of UI Constants

  //#region Start of Date Methods

  const startDateChanged = (date) => {
    setStartDate(date);

    if (!date || (endDate && dateIsBeforeDate(endDate, date))) {
      setEndDate(null);
    }
  };

  const endDateChanged = (date) => {
    if (dateIsBeforeDate(startDate, date)) {
      setEndDate(date);
    }
  };

  const disabledStartDate = (currDate) => dateIsBeforeDate(currDate, moment().startOf('day').subtract(1, 'second'));
  const disabledEndDate = (currDate) =>
    dateIsBeforeDate(currDate, moment().startOf('day')) || dateIsBeforeDate(currDate, moment(startDate).add(1, 'day'));

  const applyDateChanges = (e) => {
    preventDefaults(e);
    changeCourseDates(startDate, endDate);
  };

  //#endregion End of Date Methods

  //#region Start of Business Logics

  const groupInventoryBySession = (inventories = []) => {
    let sessionArr = [];

    inventories
      .filter(
        (inventory) =>
          moment(inventory.start_time).isSameOrAfter(moment(courseStartDate).startOf('day')) &&
          moment(inventory.end_time).isSameOrBefore(moment(courseEndDate).endOf('day'))
      )
      .forEach((inventory) => {
        const foundIndex = sessionArr.findIndex((session) => session.session_id === inventory.session_id);

        if (foundIndex >= 0) {
          sessionArr[foundIndex].inventories.push(inventory);
        } else {
          const sessionData = {
            session_id: inventory.session_id,
            session_name: inventory.name,
            inventories: [inventory],
          };

          sessionArr.push(sessionData);
        }
      });

    return sessionArr;
  };

  const addSessionsToContent = (e) => {
    preventDefaults(e);

    if (addContentMethod) {
      setIsLoading(true);

      inventories
        .filter((inventory) => selectedSessionPopupContent.includes(inventory.inventory_external_id))
        .forEach((inventory) => {
          addContentMethod({
            name: inventory.name,
            product_id: inventory.inventory_external_id,
            product_type: 'SESSION',
          });
        });

      setIsLoading(false);
      setSelectedSessionPopupContent([]);
      handleCloseModal();
    }
  };

  //#endregion End of Business Logics

  return (
    <Modal
      title={<Title level={5}> Add Sessions To Module </Title>}
      visible={visible}
      centered={true}
      onCancel={handleCloseModal}
      footer={
        <Button
          type="primary"
          size="large"
          onClick={addSessionsToContent}
          loading={isLoading}
          disabled={selectedSessionPopupContent.length <= 0}
        >
          Add Selected Session to Module
        </Button>
      }
      width={820}
      afterClose={resetBodyStyle}
      bodyStyle={{
        maxHeight: 'calc(100vh - 200px)',
        overflow: 'scroll',
      }}
    >
      <Spin spinning={isLoading} tip="Processing..." size="large">
        <Row gutter={[10, 10]}>
          <Col xs={24}>
            <Space direction="vertical">
              <div>
                <Text strong>
                  Sessions shown below is limited to Start Date{' '}
                  <DatePicker
                    placeholder="Select Start Date"
                    onChange={startDateChanged}
                    disabledDate={disabledStartDate}
                    className={styles.inlineDatePicker}
                    defaultValue={courseStartDate}
                    value={startDate}
                  />{' '}
                  End Date{' '}
                  <DatePicker
                    placeholder="Select End Date"
                    onChange={endDateChanged}
                    disabledDate={disabledEndDate}
                    className={styles.inlineDatePicker}
                    defaultValue={courseEndDate}
                    value={endDate}
                  />{' '}
                  <Button
                    type="primary"
                    disabled={!startDate || !endDate}
                    onClick={applyDateChanges}
                    className={styles.inlineButton}
                  >
                    Apply
                  </Button>
                </Text>
              </div>
              <Text strong>To see more sessions, change the start/end date and click on Apply</Text>
            </Space>
          </Col>
          <Col xs={24}>
            {inventoryListFilteredByCourseDate.length > 0 ? (
              <Collapse
                activeKey={expandedAccordionKeys}
                onChange={setExpandedAccordionKeys}
                expandIconPosition="right"
                expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}
              >
                {groupInventoryBySession(inventories).map((session) => (
                  <Panel key={session.session_id} header={session.session_name}>
                    <Table
                      columns={sessionPopupColumns}
                      data={session.inventories}
                      rowKey={(record) => record.inventory_external_id}
                    />
                  </Panel>
                ))}
              </Collapse>
            ) : (
              <Row justify="center">
                <Col>
                  <Button type="primary" size="large" onClick={handleCreateNewSessionClicked}>
                    Create New Session
                  </Button>
                </Col>
              </Row>
            )}
          </Col>
        </Row>
      </Spin>
    </Modal>
  );
};

export default SessionContentPopup;
