import React from 'react';
import { useHistory, generatePath } from 'react-router';

import { Space, Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

import Routes from 'routes';

import { attendeeProductOrderTypes } from 'utils/constants';
import {
  localStorageActiveCourseContentDataKey,
  localStorageAttendeeCourseDataKey,
  storeActiveCourseContentInfoInLS,
} from 'utils/course';

import styles from './style.module.scss';

const NextCourseContentButton = () => {
  const history = useHistory();

  const activeCourseData = JSON.parse(localStorage.getItem(localStorageAttendeeCourseDataKey));
  const activeContentMetadata = JSON.parse(localStorage.getItem(localStorageActiveCourseContentDataKey));

  if (!activeContentMetadata || !activeCourseData) {
    return null;
  }

  const courseModules = activeCourseData?.course?.modules ?? [];

  if (courseModules.length <= 0) {
    return null;
  }

  const { module_idx = 0, module_content_idx = 0 } = activeContentMetadata;

  const metadataMatchesContent = () => {
    const productData = courseModules[module_idx].module_content[module_content_idx];
    return (
      productData.product_type === activeContentMetadata.product_type &&
      productData.product_id === activeContentMetadata.product_id
    );
  };

  if (!metadataMatchesContent()) {
    return null;
  }

  const isViewableContent = (contentData) =>
    contentData.product_type === 'DOCUMENT' || (contentData.product_type === 'VIDEO' && contentData.order_id);

  const getNextViewableContent = () => {
    for (let moduleIterator = module_idx; moduleIterator < courseModules.length; moduleIterator++) {
      for (
        let contentIterator = moduleIterator === module_idx ? module_content_idx + 1 : 0;
        contentIterator < courseModules[moduleIterator].module_content.length;
        contentIterator++
      ) {
        const productData = courseModules[moduleIterator].module_content[contentIterator];

        if (isViewableContent(productData)) {
          return { module_idx: moduleIterator, content_idx: contentIterator, ...productData };
        }
      }
    }

    return null;
  };

  const nextViewableContent = getNextViewableContent();

  const getPrevViewableContent = () => {
    for (let moduleIterator = module_idx; moduleIterator >= 0; moduleIterator--) {
      for (
        let contentIterator =
          moduleIterator === module_idx
            ? module_content_idx - 1
            : courseModules[moduleIterator].module_content.length - 1;
        contentIterator >= 0;
        contentIterator--
      ) {
        const productData = courseModules[moduleIterator].module_content[contentIterator];

        if (isViewableContent(productData)) {
          return { module_idx: moduleIterator, content_idx: contentIterator, ...productData };
        }
      }
    }

    return null;
  };

  const prevViewableContent = getPrevViewableContent();

  const handleContentRedirection = (contentData) => {
    storeActiveCourseContentInfoInLS(contentData.module_idx, contentData);

    if (contentData.product_type === 'DOCUMENT') {
      history.push(
        Routes.attendeeDashboard.rootPath +
          generatePath(Routes.attendeeDashboard.documentDetails, {
            product_type: attendeeProductOrderTypes.COURSE,
            product_order_id: activeCourseData.course_order_id,
            document_id: contentData.product_id,
          })
      );
    } else if (contentData.product_type === 'VIDEO' && contentData.order_id) {
      history.push(
        Routes.attendeeDashboard.rootPath +
          Routes.attendeeDashboard.videos +
          `/${contentData.product_id}/${contentData.order_id}`
      );
    }
  };

  return (
    <div className={styles.buttonsContainer}>
      <Space align="center">
        {prevViewableContent ? (
          <Button
            ghost
            size="small"
            type="primary"
            icon={<LeftOutlined />}
            onClick={() => handleContentRedirection(prevViewableContent)}
          >
            Prev. course content
          </Button>
        ) : null}
        {nextViewableContent ? (
          <Button ghost size="small" type="primary" onClick={() => handleContentRedirection(nextViewableContent)}>
            Next course content <RightOutlined className={styles.ml5} />
          </Button>
        ) : null}
      </Space>
    </div>
  );
};

export default NextCourseContentButton;
