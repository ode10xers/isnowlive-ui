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

export const getCourseEmptyContentCount = (courseModules = []) =>
  courseModules.reduce(
    (acc, module) => (acc += module.module_content.filter((content) => !content.product_type).length ?? 0),
    0
  );

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
