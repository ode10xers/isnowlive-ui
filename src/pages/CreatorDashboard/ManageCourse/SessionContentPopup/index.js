import React, { useState } from 'react';

import { Button, Modal, Collapse, Typography, Spin, message } from 'antd';
import { DownOutlined, CheckCircleFilled } from '@ant-design/icons';

import Table from 'components/Table';
import { resetBodyStyle } from 'components/Modals/modals';

import dateUtil from 'utils/date';
import { preventDefaults, getDuration } from 'utils/helper';

import styles from './styles.module.scss';

const { Panel } = Collapse;
const { Title } = Typography;

const {
  formatDate: { toLongDateWithLongDay, toLocaleTime },
} = dateUtil;

const SessionContentPopup = ({ visible, closeModal, inventories = [], addContentMethod = null }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSessionPopupContent, setSelectedSessionPopupContent] = useState([]);

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

  const groupInventoryBySession = (inventories = []) => {
    let sessionArr = [];

    inventories.forEach((inventory) => {
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

      message.success('Sessions added to module successfully!');
      setIsLoading(false);
      setSelectedSessionPopupContent([]);
      closeModal();
    }
  };

  return (
    <Modal
      title={<Title level={5}> Add Sessions To Module </Title>}
      visible={visible}
      centered={true}
      onCancel={closeModal}
      footer={
        <Button type="primary" size="large" onClick={addSessionsToContent} loading={isLoading}>
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
        <Collapse
          expandIconPosition="right"
          ghost
          expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}
        >
          {groupInventoryBySession(inventories).map((session) => (
            <Panel key={session.session_id} className={styles.sessionPopupAccordionItem} header={session.session_name}>
              <Table
                columns={sessionPopupColumns}
                data={session.inventories}
                rowKey={(record) => record.inventory_external_id}
              />
            </Panel>
          ))}
        </Collapse>
      </Spin>
    </Modal>
  );
};

export default SessionContentPopup;
