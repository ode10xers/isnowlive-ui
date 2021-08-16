import React from 'react';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';

import { Row, Col, Button } from 'antd';

import Routes from 'routes';

import CoursesListItem from '../CoursesListItem';

import { getLocalUserDetails } from 'utils/storage';
import {
  generateUrlFromUsername,
  isBrightColorShade,
  isInCreatorDashboard,
  preventDefaults,
  convertHexToRGB,
} from 'utils/helper';

import styles from './style.module.scss';

const CoursesListView = ({ limit = 2, courses = [], profileColor }) => {
  const history = useHistory();

  const renderCourseCards = (course) => (
    <Col xs={24} sm={12} key={course.id}>
      <CoursesListItem course={course} />
    </Col>
  );

  const handleMoreClicked = (e) => {
    preventDefaults(e);

    if (isInCreatorDashboard()) {
      const localUserDetails = getLocalUserDetails();

      window.open(generateUrlFromUsername(localUserDetails?.username ?? 'app') + Routes.list.courses);
    } else {
      history.push(Routes.list.courses);
    }
  };

  return (
    <div>
      {courses.length > 0 && (
        <Row>
          <Col span={16}>{courses.slice(0, limit).map(renderCourseCards)}</Col>
          {courses.length > limit && (
            <Col xs={24}>
              <Row justify="center">
                <Col>
                  <Button
                    className={classNames(
                      styles.moreButton,
                      profileColor
                        ? isBrightColorShade(convertHexToRGB(profileColor))
                          ? styles.lightBg
                          : undefined
                        : undefined
                    )}
                    type="primary"
                    onClick={handleMoreClicked}
                  >
                    MORE
                  </Button>
                </Col>
              </Row>
            </Col>
          )}
        </Row>
      )}
    </div>
  );
};

export default CoursesListView;
