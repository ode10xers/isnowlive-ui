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

export const getCourseSessionDetailsContentCount = (courseModules = []) =>
  courseModules.reduce(
    (acc, module) =>
      (acc += module.module_content.filter((content) => content.product_type.toUpperCase() === 'SESSION').length ?? 0),
    0
  );

export const getCourseVideoDetailsContentCount = (courseModules = []) =>
  courseModules.reduce(
    (acc, module) =>
      (acc += module.module_content.filter((content) => content.product_type.toUpperCase() === 'VIDEO').length ?? 0),
    0
  );
