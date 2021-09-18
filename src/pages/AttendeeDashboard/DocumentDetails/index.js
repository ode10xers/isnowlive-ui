import React, { useEffect, useState, useCallback } from 'react';

import { Row, Col, Typography, Spin, Button, Empty, message } from 'antd';
import { DownloadOutlined, LeftOutlined } from '@ant-design/icons';

import apis from 'apis';

import DocumentEmbed from 'components/DocumentEmbed';
import { showErrorModal } from 'components/Modals/modals';

import { attendeeProductOrderTypes } from 'utils/constants';
import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const { Title } = Typography;

const DocumentDetails = ({ match, history }) => {
  const productTypeParams = match.params.product_type;
  const productOrderIdParams = match.params.product_order_id;
  const documentIdParams = match.params.document_id;

  const [documentDetails, setDocumentDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocumentDetails = useCallback(async (productType, productOrderId, documentId) => {
    setIsLoading(true);
    try {
      let targetAPI = null;

      // TODO: Add more product type when supported
      if (productType === attendeeProductOrderTypes.COURSE) {
        targetAPI = apis.documents.getAttendeeDocumentDetailsForCourse;
      }

      if (targetAPI) {
        const { status, data } = await targetAPI(productOrderId, documentId);

        if (isAPISuccess(status) && data) {
          setDocumentDetails(data);
        }
      } else {
        message.error('Invalid product type!');
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to fetch file details', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDocumentDetails(productTypeParams, productOrderIdParams, documentIdParams);
  }, [productTypeParams, productOrderIdParams, documentIdParams, fetchDocumentDetails]);

  return (
    <div className={styles.p10}>
      <Spin spinning={isLoading} tip="Fetching file details">
        <Row gutter={[8, 12]}>
          <Col xs={24}>
            <Button ghost type="primary" icon={<LeftOutlined />} onClick={() => history.goBack()}>
              Back
            </Button>
          </Col>
          {documentDetails ? (
            <>
              <Col xs={24}>
                <Title level={3}>
                  {documentDetails?.name}{' '}
                  {documentDetails?.is_downloadable ? (
                    <Button icon={<DownloadOutlined />} onClick={() => window.open(documentDetails?.url)} />
                  ) : null}
                </Title>
              </Col>
              <Col xs={24}>
                <DocumentEmbed documentLink={documentDetails.url ?? null} />
              </Col>
            </>
          ) : (
            <Col xs={24}>
              <Empty description="No valid file found" />
            </Col>
          )}
        </Row>
      </Spin>
    </div>
  );
};

export default DocumentDetails;
