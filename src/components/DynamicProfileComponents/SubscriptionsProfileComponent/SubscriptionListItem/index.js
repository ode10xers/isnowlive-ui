import React from 'react';
import classNames from 'classnames';

import { Row, Col } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';

import { getShadeForHexColor, preventDefaults } from 'utils/helper';
import { generateBaseCreditsText } from 'utils/subscriptions';

import styles from './style.module.scss';
import { redirectToMembershipPage } from 'utils/redirect';

// const { Text } = Typography;

const SubscriptionListItem = ({ subscription }) => {
  const getSubscriptionColorCode = () => subscription.color_code ?? '#accbab';

  const handleMembershipItemClicked = (e) => {
    preventDefaults(e);
    redirectToMembershipPage(subscription);
  };

  // TODO: Do dynamic font size adjust here later
  return (
    <div
      className={styles.membershipItem}
      style={{
        '--primary-color': `${getSubscriptionColorCode()}80`,
        '--secondary-color': getShadeForHexColor(getSubscriptionColorCode(), 1),
        '--ternary-color': getShadeForHexColor(getSubscriptionColorCode(), 2),
      }}
      onClick={handleMembershipItemClicked}
    >
      <Row gutter={[8, 12]}>
        <Col xs={24}>
          <Row gutter={8}>
            <Col xs={22}>
              <div
                className={classNames(
                  styles.membershipName,
                  subscription?.name?.length > 25 ? styles.textLength50 : styles.textLength25
                )}
              >
                {subscription?.name}
              </div>
            </Col>
            <Col xs={2}>
              <div className={styles.arrowSignContainer}>
                <ArrowRightOutlined className={styles.arrowSign} />
              </div>
            </Col>
          </Row>
        </Col>
        <Col xs={24}>
          <Row gutter={8}>
            <Col xs={14}>
              <div className={styles.membershipDetails}>
                {generateBaseCreditsText(subscription, false).replace(' credits/month', '')}
                <br />
                per month
              </div>
            </Col>
            <Col xs={10}>
              <div className={styles.membershipPrice}>
                {subscription?.currency?.toUpperCase()} {subscription?.price} / month
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

// const SubscriptionListItem = ({ subscription }) => {
//   const getSubscriptionColorCode = () => subscription.color_code ?? '#1890ff';

//   return (
//     <div
//       className={styles.subscriptionItem}
//       style={{
//         '--primary-color': getSubscriptionColorCode(),
//         '--primary-color-07': `${getSubscriptionColorCode()}70`,
//         '--primary-color-05': `${getSubscriptionColorCode()}50`,
//         '--primary-color-03': `${getSubscriptionColorCode()}30`,
//         '--primary-color-01': `${getSubscriptionColorCode()}10`,
//       }}
//     >
//       <Row>
//         <Col xs={23} className={styles.subscriptionDetailsContainer}>
//           <Row gutter={[8, 16]}>
//             <Col xs={24} className={styles.subscriptionTitleContainer}>
//               <div className={styles.subscriptionTitle}>{subscription?.name}</div>
//               <div className={styles.subscriptionPrice}>
//                 {subscription?.currency?.toUpperCase()} {subscription?.price} / month
//               </div>
//             </Col>
//             <Col xs={24}>
//               <Text className={styles.subscriptionDetails}> {generateBaseCreditsText(subscription, false)} </Text>
//             </Col>
//           </Row>
//         </Col>
//         <Col xs={1} className={styles.subscriptionDetailsArrowContainer}>
//           <Space align="center" className={styles.subscriptionDetailsArrow}>
//             <CaretRightOutlined />
//           </Space>
//         </Col>
//       </Row>
//     </div>
//   );
// };

export default SubscriptionListItem;
