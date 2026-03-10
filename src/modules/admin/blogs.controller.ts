import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { BlogsService } from './blogs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Admin Blogs')
@Controller('admin/blogs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BlogsController {
    constructor(private readonly blogsService: BlogsService) { }

    @Get('categories')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get all blog categories' })
    getCategories() {
        return this.blogsService.getCategories();
    }

    @Post('categories')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Create a blog category' })
    createCategory(@Body() body: { name: string; slug: string }) {
        return this.blogsService.createCategory(body);
    }

    @Get('posts')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get all blog posts' })
    getPosts(@Query() query: { search?: string }) {
        return this.blogsService.getPosts(query);
    }

    @Get('posts/:id')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get blog post by id' })
    getPostById(@Param('id') id: string) {
        return this.blogsService.getPostById(id);
    }

    @Post('posts')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Create a new blog post' })
    createPost(@Body() body: any) {
        return this.blogsService.createPost(body);
    }

    @Put('posts/:id')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Update a blog post' })
    updatePost(@Param('id') id: string, @Body() body: any) {
        return this.blogsService.updatePost(id, body);
    }

    @Delete('posts/:id')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Delete a blog post' })
    deletePost(@Param('id') id: string) {
        return this.blogsService.deletePost(id);
    }
}
