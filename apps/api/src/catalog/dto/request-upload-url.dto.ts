import { IsIn, IsInt, IsString, Max, Min } from 'class-validator';

// 200MB — generous for 3D models with textures (the largest real file
// uploaded this session was ~66MB), while still blocking accidental or
// malicious multi-GB uploads that would otherwise cost storage/egress
// with no server-side check at all.
export const MAX_MODEL_FILE_SIZE_BYTES = 200 * 1024 * 1024;

export class RequestUploadUrlDto {
  @IsString()
  filename!: string;

  @IsIn(['model/gltf-binary', 'application/octet-stream'])
  contentType!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_MODEL_FILE_SIZE_BYTES)
  fileSize!: number;
}