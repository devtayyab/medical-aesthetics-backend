import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendLoginCodeDto {
  @ApiProperty({ description: 'challengeToken returned by POST /auth/login' })
  @IsString()
  challengeToken: string;
}

export class VerifyLoginCodeDto extends ResendLoginCodeDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\s*\d{6}\s*$/, { message: 'The code has 6 digits.' })
  code: string;
}
