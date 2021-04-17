import { courseType } from "./helper";

/* Products = all the sellable entity in our app - sessions, passes, courses etc
  This is the helper file to do different common things related to product here */

export const formatPassesData = (data, profileUsername) => {
  return data.map((pass) => ({
    ...pass,
    sessions:
      pass.sessions?.map((session) => ({
        ...session,
        key: `${pass.id}_${session.session_id}`,
        username: profileUsername,
      })) || [],
    videos:
      pass.videos?.map((video) => ({
        ...video,
        key: `${pass.id}_${video.external_id}`,
        username: profileUsername,
      })) || [],
  }));
};

export const getLiveCoursesFromCourses = (data) => {
  return data.filter((course) => course.type === courseType.MIXED || course.type === 'live');
};

export const getVideoCoursesFromCourses = (data) => {
  return data.filter((course) => course.type === courseType.VIDEO_NON_SEQ || course.type === courseType.VIDEO_SEQ)
}