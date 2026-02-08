import { IsIn, IsString } from 'class-validator';

export const SupportedFormats = ['pdf', 'docx', 'pptx', 'xlsx', 'png', 'txt'] as const;

export class CreateJobDto {
  @IsString()
  @IsIn(SupportedFormats)
  targetFormat!: (typeof SupportedFormats)[number];
}
