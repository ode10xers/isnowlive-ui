export const getCourseSessionContentCount = (courseModules = []) =>
  courseModules.reduce(
    (acc, module) => (acc += module.contents.filter((content) => content.content_type === 'SESSION').length ?? 0),
    0
  );

export const getCourseVideoContentCount = (courseModules = []) =>
  courseModules.reduce(
    (acc, module) => (acc += module.contents.filter((content) => content.content_type === 'VIDEO').length ?? 0),
    0
  );
