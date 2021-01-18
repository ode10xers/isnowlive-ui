import React, { useState, useEffect, useCallback } from 'react';
import { Table, Modal } from 'antd';

import apis from 'apis';

import styles from './styles.module.scss';

const ClassPassList = () => {
  const [passes, setPasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getPassesForAttendee = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apis.passes.getAttendeePasses();

      if (data) {
        setPasses(data);
      }
    } catch (error) {
      Modal.error({});
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getPassesForAttendee();
  }, [getPassesForAttendee]);

  const passesColumns = [
    {
      title: 'Pass Name',
      dataIndex: '',
      key: '',
    },
    {
      title: 'Pass Count',
      dataIndex: '',
      key: '',
    },
    {
      title: 'Validity',
      dataIndex: '',
      key: '',
    },
    {
      title: 'Expires On',
      dataIndex: '',
      key: '',
    },
    {
      title: 'Price',
      dataIndex: '',
      key: '',
    },
    {
      title: '',
      render: (text, record) => {
        return <div></div>;
      },
    },
  ];

  return <div></div>;
};

export default ClassPassList;
