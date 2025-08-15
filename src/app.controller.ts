import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth(): object {
    return {
      status: 'ok',
      message: 'Medical Aesthetics Platform API is running',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('version')
  @ApiOperation({ summary: 'Get API version' })
  getVersion(): object {
    return {
      version: '1.0.0',
      name: 'Medical Aesthetics Platform API',
    };
  }
}