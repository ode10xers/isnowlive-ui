import React, { useState, useEffect, useCallback } from 'react';

import apis from 'apis';
import { showErrorModal } from 'components/modals';

// import styles from './styles.module.scss';

const ClassPassList = () => {
  const [passes, setPasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  console.log(passes);
  console.log(isLoading);

  const getPassesForAttendee = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apis.passes.getAttendeePasses();

      if (data) {
        setPasses(data);
      }
    } catch (error) {
      showErrorModal('Something wrong happened', error.response?.data?.message);
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

  console.log(passesColumns);

  return <div></div>;
};

export default ClassPassList;
