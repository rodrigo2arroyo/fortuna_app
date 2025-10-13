export interface ApiResponse<T> {
  data: T | null;
  code: string;
  message: string;
}
