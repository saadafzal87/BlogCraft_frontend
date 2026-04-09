import { usePostContext } from '../context/PostContext';

export const usePosts = () => {
  return usePostContext();
};
