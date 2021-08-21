import React, { CSSProperties } from 'react';
import { Col, Row, Typography } from 'antd';

import styles from './style.module.scss';

const { Text } = Typography;

export interface DynamicProfileComponentContainerProps {
  icon?: React.ReactElement | null;
  textColor?: CSSProperties['color'];
  title?: string;
  isEditing?: boolean;
  dragDropHandle?: React.ReactElement | null;
  editView?: React.ReactElement | null;
}

const DynamicProfileComponentContainer: React.FC<DynamicProfileComponentContainerProps> = ({
  children,
  icon,
  textColor,
  isEditing = false,
  dragDropHandle = null,
  editView = null,
  title,
}) => (
  <>
    <Row gutter={[8, 8]} className={styles.dynamicProfileComponentContainerTitleRow}>
      {dragDropHandle && isEditing && <Col flex="0 0 40px">{dragDropHandle}</Col>}
      <Col flex="1 1 auto">
        <Text
          className={styles.dynamicProfileComponentContainerTitle}
          style={{ color: `var(--passion-profile-darker-color, ${textColor})` }}
        >
          {icon}
          {title}
        </Text>
      </Col>
      {editView && isEditing && <Col flex="0 0 120px" className={styles.textAlignRight}>{editView}</Col>}
    </Row>
    <Row>
      <Col span={24}>{children}</Col>
    </Row>
  </>
);

DynamicProfileComponentContainer.defaultProps = {
  textColor: '#0050B3',
};

export default DynamicProfileComponentContainer;
