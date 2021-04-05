import React, { useState, useCallback, useEffect } from 'react';

import { Row, Col, Button, Select, message } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';

import { isAPISuccess } from 'utils/helper';

const InventoryDocumentEditor = ({ onFinish, onCancel, sessionInventoryDocuments = [] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [creatorDocuments, setCreatorDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  const getCreatorDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.documents.getCreatorDocuments();

      if (isAPISuccess(status) && data) {
        setCreatorDocuments(data.data);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to fetch user documents');
      onCancel();
    }
    setIsLoading(false);
  }, [onCancel]);

  useEffect(() => {
    if (sessionInventoryDocuments.length > 0) {
      setSelectedDocuments(sessionInventoryDocuments);
    }

    getCreatorDocuments();
  }, [getCreatorDocuments, sessionInventoryDocuments]);

  return (
    <Loader loading={isLoading} text="Fetching creator documents...">
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Select
            showArrow
            placeholder="Select documents you want to include in the session"
            mode="multiple"
            maxTagCount="responsive"
            value={selectedDocuments}
            onChange={(val) => setSelectedDocuments(val)}
            options={creatorDocuments.map((document) => ({
              label: document.name,
              value: document.url,
            }))}
          />
        </Col>
        <Col xs={24}>
          <Button block type="primary" onClick={() => onFinish(selectedDocuments)}>
            Save Changes
          </Button>
        </Col>
      </Row>
    </Loader>
  );
};

export default InventoryDocumentEditor;
