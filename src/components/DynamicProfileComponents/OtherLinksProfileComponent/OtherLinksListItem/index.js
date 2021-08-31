import React from 'react';

import { Typography } from 'antd';

// import { Row, Col, Space, Image, Spin, Typography } from 'antd';
// import { CaretRightOutlined } from '@ant-design/icons';

import styles from './style.module.scss';

const { Title } = Typography;

const OtherLinksListItem = ({ link }) => {
  return (
    <div
      style={{
        backgroundColor: link.backgroundColor.includes('#') ? link.backgroundColor : `#${link.backgroundColor}`,
      }}
      className={styles.linkItem}
    >
      <Title
        level={5}
        style={{ color: link.textColor.includes('#') ? link.textColor : `#${link.textColor}` }}
        className={styles.linkItemTitle}
      >
        {link.title}
      </Title>
    </div>
  );
};

// const OtherLinksListItem = ({ loading, preview }) => (
//   <Row className={styles.linkPreviewItem}>
//     <Col xs={23} className={styles.linkPreviewDetailsContainer}>
//       <Spin spinning={loading} tip="Loading preview">
//         <Space size="small" align="center">
//           <div className={styles.linkPreviewImageContainer}>
//             <Image className={styles.linkPreviewImage} src={preview.img} alt={preview.title} preview={false} />
//           </div>
//           <Space align="center" className={styles.linkPreviewTitleContainer}>
//             <Title level={5} className={styles.linkPreviewTitle}>
//               {preview.title}
//             </Title>
//           </Space>
//         </Space>
//       </Spin>
//     </Col>
//     <Col xs={1} className={styles.linkPreviewArrowContainer}>
//       <Space align="center" className={styles.linkPreviewArrow}>
//         <CaretRightOutlined />
//       </Space>
//     </Col>
//   </Row>
// );

export default OtherLinksListItem;
