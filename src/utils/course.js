export const getCourseSessionContentCount = (courseModules = []) =>
  courseModules.reduce(
    (acc, module) =>
      (acc += module.contents.filter((content) => content.product_type.toUpperCase() === 'SESSION').length ?? 0),
    0
  );

export const getCourseVideoContentCount = (courseModules = []) =>
  courseModules.reduce(
    (acc, module) =>
      (acc += module.contents.filter((content) => content.product_type.toUpperCase() === 'VIDEO').length ?? 0),
    0
  );
