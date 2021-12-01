import React, { useState, useEffect, useCallback } from 'react';

import { Spin, message } from 'antd';

import apis from 'apis';

import InventoryDateList from 'components/InventoryDateList';

import { isAPISuccess } from 'utils/helper';
import parseQueryString from 'utils/parseQueryString';

import styles from './style.module.scss';

// NOTE : Might want to implement infinite scrolling here
const InventoryList = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [inventories, setInventories] = useState([]);

  // NOTE: If the values are present in query string, they are treated as string
  const queryStringData = parseQueryString(window.location.search);
  const showImage = queryStringData['showImage']?.toLowerCase() === 'true';
  const showDesc = queryStringData['showDesc']?.toLowerCase() === 'true';

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

  return (
    <div className={styles.inventoryListPluginContainer}>
      <Spin spinning={isLoading} tip="Fetching schedules">
        <InventoryDateList inventories={inventories} showImage={showImage} showDesc={showDesc} />
      </Spin>
    </div>
  );
};

export default InventoryList;
