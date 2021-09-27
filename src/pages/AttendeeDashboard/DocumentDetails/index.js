import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { generatePath } from 'react-router';

import { Row, Col, Spin, Button, Empty, PageHeader, Image, Grid, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import DocumentEmbed from 'components/DocumentEmbed';
import { showErrorModal } from 'components/Modals/modals';
import NextCourseContentButton from 'components/NextCourseContentButton';

import { attendeeProductOrderTypes } from 'utils/constants';
import { isAPISuccess } from 'utils/helper';
import { localStorageActiveCourseContentDataKey, localStorageAttendeeCourseDataKey } from 'utils/course';

import styles from './style.module.scss';

const { useBreakpoint } = Grid;

const DocumentDetails = ({ match, history }) => {
  const { xs } = useBreakpoint();

  const productTypeParams = match.params.product_type;
  const productOrderIdParams = match.params.product_order_id;
  const documentIdParams = match.params.document_id;

  const [documentDetails, setDocumentDetails] = useState(null);
  const [courseContentDetails, setCourseContentDetails] = useState(null);
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

  const fetchCourseContentInfo = useCallback(() => {
    const activeCourseContentMetadata = JSON.parse(localStorage.getItem(localStorageActiveCourseContentDataKey));
    const activeCourseInfo = JSON.parse(localStorage.getItem(localStorageAttendeeCourseDataKey));

    if (!activeCourseContentMetadata || !activeCourseInfo) {
      setCourseContentDetails(null);
      return;
    }

    const courseContentInfo =
      activeCourseInfo?.course?.modules[activeCourseContentMetadata?.module_idx ?? 0]?.module_content[
        activeCourseContentMetadata?.module_content_idx ?? 0
      ];

    if (
      courseContentInfo &&
      courseContentInfo?.product_id === activeCourseContentMetadata?.product_id &&
      courseContentInfo?.product_type === 'DOCUMENT'
    ) {
      setCourseContentDetails(courseContentInfo);
    }
  }, []);

  useEffect(() => {
    fetchDocumentDetails(productTypeParams, productOrderIdParams, documentIdParams);
    fetchCourseContentInfo();
  }, [productTypeParams, productOrderIdParams, documentIdParams, fetchDocumentDetails, fetchCourseContentInfo]);

  const handleGoBack = () => {
    if (productTypeParams === attendeeProductOrderTypes.COURSE) {
      history.push(
        Routes.attendeeDashboard.rootPath +
          generatePath(Routes.attendeeDashboard.courseDetails, { course_order_id: productOrderIdParams })
      );
    } else {
      history.goBack();
    }
  };

  const isActiveCourseContent = useMemo(() => {
    const activeCourseContentMetadata = JSON.parse(localStorage.getItem(localStorageActiveCourseContentDataKey));

    return (
      productTypeParams === attendeeProductOrderTypes.COURSE &&
      activeCourseContentMetadata.product_type === 'DOCUMENT' &&
      documentIdParams === activeCourseContentMetadata.product_id
    );
  }, [productTypeParams, documentIdParams]);

  return (
    <div className={styles.documentPageContainer}>
      <Spin spinning={isLoading} tip="Fetching file details">
        <Row gutter={[8, 2]}>
          <Col xs={24}>
            <PageHeader
              className={styles.pageHeader}
              onBack={handleGoBack}
              title={courseContentDetails?.name ?? documentDetails?.name ?? ''}
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
              extra={isActiveCourseContent && !xs ? [<NextCourseContentButton key="course_buttons" />] : []}
            />
          </Col>
          {xs && (
            <Col xs={24} className={styles.textAlignCenter}>
              <NextCourseContentButton />
            </Col>
          )}
          {documentDetails?.url ? (
            documentDetails?.url.includes('/image/') ? (
              <Col xs={24} className={styles.textAlignCenter}>
                <Image width="100%" preview={false} className={styles.mt10} src={documentDetails?.url} />
              </Col>
            ) : documentDetails?.url.includes('.pdf') ? (
              <Col xs={24} className={styles.textAlignCenter}>
                <div className={styles.fileViewer}>
                  <DocumentEmbed documentLink={documentDetails.url ?? null} />
                </div>
              </Col>
            ) : null
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
