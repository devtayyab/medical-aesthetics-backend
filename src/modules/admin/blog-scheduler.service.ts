import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { BlogPost } from '../clinics/entities/blog.entity';

@Injectable()
export class BlogSchedulerService {
    private readonly logger = new Logger(BlogSchedulerService.name);

    constructor(
        @InjectRepository(BlogPost)
        private blogPostRepository: Repository<BlogPost>,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleScheduledPosts() {
        this.logger.debug('Checking for scheduled blog posts...');
        const now = new Date();

        const pendingPosts = await this.blogPostRepository.find({
            where: {
                isPublished: false,
                scheduledAt: LessThanOrEqual(now),
            },
        });

        if (pendingPosts.length > 0) {
            this.logger.log(`Publishing ${pendingPosts.length} scheduled blog posts`);
            for (const post of pendingPosts) {
                post.isPublished = true;
                post.publishedAt = now;
                post.scheduledAt = null; // Clear scheduled date after publishing
            }
            await this.blogPostRepository.save(pendingPosts);
        }
    }
}
