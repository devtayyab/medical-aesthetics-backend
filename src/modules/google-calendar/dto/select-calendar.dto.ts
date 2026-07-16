import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SelectCalendarDto {
  // Pick an existing calendar by its Google calendar id.
  @IsOptional()
  @IsString()
  calendarId?: string;

  // Or create a brand-new calendar with this name and sync into it.
  @IsOptional()
  @IsString()
  @MaxLength(120)
  createNewName?: string;
}
