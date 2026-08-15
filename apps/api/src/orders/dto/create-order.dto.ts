import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  modelId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  // Kept loose (just an object) for now — we'll formalize this into a
  // proper AddressDto with validated fields once the Payments module
  // needs it for real shipping calculations.
  @IsObject()
  shippingAddress!: Record<string, any>;
}