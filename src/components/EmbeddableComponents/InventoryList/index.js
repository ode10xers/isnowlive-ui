import React, { useState, useEffect, useCallback, useMemo } from 'react';
import moment from 'moment';

import { Row, Col, Typography, Button, Spin, Empty, message } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

import apis from 'apis';

import { getDuration, isAPISuccess } from 'utils/helper';
import { redirectToInventoryPage } from 'utils/redirect';

import styles from './style.module.scss';

const { Title, Paragraph, Text } = Typography;

// TODO: Try moving into using dateUtil
const InventoryList = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [inventories, setInventories] = useState([]);
  const inventoriesByDates = useMemo(() => {
    return inventories?.reduce((acc, inv) => {
      const momentStartTime = moment(inv.start_time);
      const monthYear = momentStartTime.format('MMMM YYYY');
      const date = momentStartTime.format('YYYY-MM-DD');

      return {
        ...acc,
        [monthYear]: {
          ...(acc[monthYear] ?? {}),
          [date]: [...(acc[monthYear]?.[date] ?? []), inv],
        },
      };
    }, {});
  }, [inventories]);
  const months = useMemo(() => Object.keys(inventoriesByDates), [inventoriesByDates]);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(0);

  const fetchUpcomingInventories = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.user.getSessionsByUsername('upcoming');

      if (isAPISuccess(status) && data) {
        setInventories(data);
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch schedule!');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUpcomingInventories();
    document.body.style.background = 'transparent';
  }, [fetchUpcomingInventories]);

  const renderInventoryItems = (dateInventoriesInMonth) => {
    const dates = Object.keys(dateInventoriesInMonth);

    return (
      <>
        {dates.length === 0
          ? null
          : dates.map((date) => (
              <div className={styles.dateContainer} key={date}>
                <div className={styles.dateHeading}>{moment(date).format('dddd, MMMM Do')}</div>
                <div className={styles.dateInventoriesContainer}>
                  <Row gutter={[8, 8]}>
                    {dateInventoriesInMonth[date].map((inventory) => (
                      <Col xs={24} key={inventory.inventory_external_id} className={styles.inventoryItem}>
                        <Row gutter={[8, 8]} align="middle" wrap={false}>
                          <Col flex="0 0 100px" className={styles.p10}>
                            <Text className={styles.inventoryStartTime}>
                              {moment(inventory.start_time).format('h:mm A')}
                            </Text>
                            <Text className={styles.inventoryDuration}>
                              {getDuration(inventory.start_time, inventory.end_time)}
                            </Text>
                          </Col>
                          <Col flex="1 1 auto" className={styles.p10}>
                            <Text className={styles.inventoryTitle}>{inventory.name}</Text>
                          </Col>
                          <Col flex="0 0 60px" className={styles.p10}>
                            <Button
                              size="large"
                              type="primary"
                              className={styles.bookButton}
                              onClick={() => redirectToInventoryPage(inventory)}
                            >
                              Book
                            </Button>
                          </Col>
                        </Row>
                      </Col>
                    ))}
                  </Row>
                </div>
              </div>
            ))}
      </>
    );
  };

  const monthPicker = useMemo(
    () => (
      <Row gutter={8} align="middle" className={styles.monthPickerContainer} wrap={false}>
        <Col flex="0 0 40px" className={styles.p10}>
          <Button
            type="primary"
            size="large"
            className={styles.monthArrowButton}
            disabled={selectedMonthIdx === 0}
            icon={<LeftOutlined />}
            onClick={() => setSelectedMonthIdx((prev) => (prev === 0 ? 0 : prev - 1))}
          />
        </Col>
        <Col flex="1 1 auto">
          <Title level={1} className={styles.monthHeader}>
            {months[selectedMonthIdx]}
          </Title>
        </Col>
        <Col flex="0 0 40px" className={styles.p10}>
          <Button
            type="primary"
            size="large"
            className={styles.monthArrowButton}
            disabled={selectedMonthIdx === months.length - 1}
            icon={<RightOutlined />}
            onClick={() => setSelectedMonthIdx((prev) => (prev === months.length - 1 ? months.length - 1 : prev + 1))}
          />
        </Col>
      </Row>
    ),
    [months, selectedMonthIdx]
  );

  return (
    <div className={styles.inventoryListPluginContainer}>
      <Spin spinning={isLoading} tip="Fetching schedules">
        <Row>
          {inventories.length > 0 ? (
            <>
              <Col xs={24} className={styles.textAlignCenter}>
                <Paragraph className={styles.helperText}>
                  You can click the arrows to change the months. Months without any sessions will be skipped and not
                  shown.
                </Paragraph>
              </Col>
              <Col xs={24}>{monthPicker}</Col>
              {months.length > 0 && selectedMonthIdx >= 0 && selectedMonthIdx < months.length && (
                <Col xs={24}>{renderInventoryItems(inventoriesByDates[months[selectedMonthIdx]])}</Col>
              )}
            </>
          ) : (
            <Col xs={24}>
              <Empty description="No available session schedule" />
            </Col>
          )}
        </Row>
      </Spin>
    </div>
  );
};

export default InventoryList;
