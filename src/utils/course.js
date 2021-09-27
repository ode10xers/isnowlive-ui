export const getCourseSessionContentCount = (courseModules = []) =>
  courseModules.reduce(
    (acc, module) =>
      (acc += module.module_content.filter((content) => content.product_type.toUpperCase() === 'SESSION').length ?? 0),
    0
  );

export const getCourseVideoContentCount = (courseModules = []) =>
  courseModules.reduce(
    (acc, module) =>
      (acc += module.module_content.filter((content) => content.product_type.toUpperCase() === 'VIDEO').length ?? 0),
    0
  );

export const getCourseDocumentContentCount = (courseModules = []) =>
  courseModules.reduce(
    (acc, module) =>
      (acc += module.module_content.filter((content) => content.product_type.toUpperCase() === 'DOCUMENT').length ?? 0),
    0
  );

export const getCourseEmptyContentCount = (courseModules = []) =>
  courseModules.reduce(
    (acc, module) => (acc += module.module_content.filter((content) => !content.product_type).length ?? 0),
    0
  );

// TODO: Remove the ones below if it's the same
// This is a separate method because
// We need to filter out contents without orders
export const getCourseOrderSessionContentCount = (courseModules = []) =>
  courseModules.reduce(
    (acc, module) =>
      (acc += module.module_content.filter((content) => content.product_type.toUpperCase() === 'SESSION').length ?? 0),
    0
  );

export const getCourseOrderVideoContentCount = (courseModules = []) =>
  courseModules.reduce(
    (acc, module) =>
      (acc += module.module_content.filter((content) => content.product_type.toUpperCase() === 'VIDEO').length ?? 0),
    0
  );

export const localStorageAttendeeCourseDataKey = 'passion_active_course_for_attendee';
// NOTE : The metadata saved in the key below should refer to the same content in the course data saved in the key above
export const localStorageActiveCourseContentDataKey = 'passion_active_course_content_for_attendee';

export const storeActiveCourseContentInfoInLS = (moduleIdx, contentData) => {
  const contentMetadata = {
    module_idx: moduleIdx,
    product_type: contentData.product_type,
    product_id: contentData.product_id,
    module_content_idx: contentData.content_idx,
  };
  localStorage.setItem(localStorageActiveCourseContentDataKey, JSON.stringify(contentMetadata));
};
