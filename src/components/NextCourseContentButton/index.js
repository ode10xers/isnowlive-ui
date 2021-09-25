import React from 'react';
import { useHistory, generatePath } from 'react-router';

import { Button } from 'antd';
import { RightOutlined } from '@ant-design/icons';

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

  if (!nextViewableContent) {
    return null;
  }

  const handleNextRedirection = () => {
    console.log(nextViewableContent);
    storeActiveCourseContentInfoInLS(nextViewableContent.module_idx, nextViewableContent);

    if (nextViewableContent.product_type === 'DOCUMENT') {
      history.push(
        Routes.attendeeDashboard.rootPath +
          generatePath(Routes.attendeeDashboard.documentDetails, {
            product_type: attendeeProductOrderTypes.COURSE,
            product_order_id: activeCourseData.course_order_id,
            document_id: nextViewableContent.product_id,
          })
      );
    } else if (nextViewableContent.product_type === 'VIDEO' && nextViewableContent.order_id) {
      history.push(
        Routes.attendeeDashboard.rootPath +
          Routes.attendeeDashboard.videos +
          `/${nextViewableContent.product_id}/${nextViewableContent.order_id}`
      );
    }
  };

  return (
    <div>
      <Button ghost type="primary" onClick={handleNextRedirection}>
        Go to next course content <RightOutlined className={styles.ml5} />
      </Button>
    </div>
  );
};

export default NextCourseContentButton;
