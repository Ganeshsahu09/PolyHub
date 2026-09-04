import { IsIn, IsString } from 'class-validator';

export class RequestUploadUrlDto {
  @IsString()
  filename!: string;

  @IsIn(['model/gltf-binary', 'application/octet-stream'])
  contentType!: string;
}