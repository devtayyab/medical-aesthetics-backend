import { Controller, Post, Headers, HttpCode, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { GoogleCalendarService } from './google-calendar.service';

/**
 * Receives Google Calendar push notifications. Public (Google cannot send a JWT);
 * authenticity is enforced by matching the per-channel token stored at watch time.
 * Always returns 200 quickly and defers real work to the queue.
 */
@ApiTags('Google Calendar')
@Controller('google-calendar')
export class GoogleCalendarWebhookController {
  private readonly logger = new Logger(GoogleCalendarWebhookController.name);

  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  @Public()
  @Post('webhook')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Google Calendar push notification receiver' })
  async webhook(
    @Headers('x-goog-channel-id') channelId: string,
    @Headers('x-goog-resource-id') resourceId: string,
    @Headers('x-goog-resource-state') resourceState: string,
    @Headers('x-goog-channel-token') token: string,
  ) {
    try {
      await this.googleCalendarService.handleWebhook({
        channelId,
        resourceId,
        resourceState,
        token,
      });
    } catch (err) {
      // Never make Google retry-storm us; log and swallow.
      this.logger.error(`Webhook handling failed: ${err.message}`);
    }
    return { received: true };
  }
}
