import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BlogsService } from './blogs.service';

@ApiTags('Public Blogs')
@Controller('public/blogs')
export class PublicBlogsController {
    constructor(private readonly blogsService: BlogsService) { }

    @Get('categories')
    @ApiOperation({ summary: 'Get all public blog categories' })
    getCategories() {
        return this.blogsService.getCategories();
    }

    @Get('posts')
    @ApiOperation({ summary: 'Get all published blog posts' })
    getPosts(@Query() query: { search?: string; categoryId?: string }) {
        return this.blogsService.getPublicPosts(query);
    }

    @Get('posts/:slug')
    @ApiOperation({ summary: 'Get public blog post by slug' })
    getPostBySlug(@Param('slug') slug: string) {
        return this.blogsService.getPublicPostBySlug(slug);
    }
}
