import React, { useEffect, useState, useCallback } from 'react';

import { Row, Col, Spin, Button, Empty, PageHeader, Image, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

import apis from 'apis';

import DocumentEmbed from 'components/DocumentEmbed';
import { showErrorModal } from 'components/Modals/modals';

import { attendeeProductOrderTypes } from 'utils/constants';
import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

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
    <div className={styles.documentPageContainer}>
      <Spin spinning={isLoading} tip="Fetching file details">
        <Row gutter={[8, 2]}>
          <Col xs={24}>
            <PageHeader
              className={styles.pageHeader}
              onBack={() => history.goBack()}
              title={documentDetails?.name ?? ''}
              subTitle={
                documentDetails?.is_downloadable ? (
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => window.open(documentDetails?.url)}
                    className={styles.ml10}
                  >
                    Download
                  </Button>
                ) : null
              }
            />
          </Col>
          {documentDetails?.url ? (
            documentDetails?.url.includes('image') ? (
              <Col xs={24} className={styles.textAlignCenter}>
                <Image width="100%" preview={true} className={styles.mt10} src={documentDetails?.url} />
              </Col>
            ) : (
              <Col xs={24} className={styles.textAlignCenter}>
                <div className={styles.fileViewer}>
                  <DocumentEmbed documentLink={documentDetails.url ?? null} />
                </div>
              </Col>
            )
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
