import { courseType } from './constants';

/* Products = all the sellable entity in our app - sessions, passes, courses etc
  This is the helper file to do different common things related to product here */

export const formatPassesData = (data) => {
  return data.map((pass) => ({
    ...pass,
    sessions:
      pass.sessions?.map((session) => ({
        ...session,
        key: `${pass.id}_${session.session_id}`,
        creator_username: pass.creator_username,
      })) || [],
    videos:
      pass.videos?.map((video) => ({
        ...video,
        key: `${pass.id}_${video.external_id}`,
        creator_username: pass.creator_username,
      })) || [],
  }));
};

// NOTE: This will now only return LIVE courses and doesn't include MIXED
export const getLiveCoursesFromCourses = (data) => {
  return data.filter((course) => course.type === courseType.LIVE);
};

export const getMixedCoursesFromCourses = (data) => {
  return data.filter((course) => course.type === courseType.MIXED);
};

export const getVideoCoursesFromCourses = (data) => {
  return data.filter(
    (course) =>
      course.type === courseType.VIDEO_NON_SEQ ||
      course.type === courseType.VIDEO_SEQ ||
      course.type === courseType.VIDEO
  );
};
