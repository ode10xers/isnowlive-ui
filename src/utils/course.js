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
