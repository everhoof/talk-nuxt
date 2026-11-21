import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import type { Picture } from '~/graphql/schema';

export function usePictureUpload() {
  const endpoint = useRuntimeConfig().public.apiHttpEndpoint;
  const { token } = useGraphql();

  return async (file: File, config?: AxiosRequestConfig): Promise<number> => {
    const body = new FormData();
    body.append('file', file);
    const response = await axios.post<Picture>(`${endpoint}/upload/image`, body, {
      ...config,
      adapter: 'xhr',
      headers: { ...config?.headers, Authorization: `Bearer ${token.value}` },
    });
    if (!response.data) throw new Error('unable to upload image');
    return response.data.id;
  };
}
