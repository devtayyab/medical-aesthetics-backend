import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogCategory, BlogPost } from '../clinics/entities/blog.entity';

@Injectable()
export class BlogsService {
    constructor(
        @InjectRepository(BlogCategory)
        private blogCategoryRepository: Repository<BlogCategory>,
        @InjectRepository(BlogPost)
        private blogPostRepository: Repository<BlogPost>,
    ) { }

    // Categories
    async getCategories() {
        return this.blogCategoryRepository.find({ relations: ['posts'] });
    }

    async createCategory(data: { name: string; slug: string }) {
        const category = this.blogCategoryRepository.create(data);
        return this.blogCategoryRepository.save(category);
    }

    // Posts
    async getPosts(query?: { search?: string }) {
        const qb = this.blogPostRepository.createQueryBuilder('post')
            .leftJoinAndSelect('post.category', 'category')
            .leftJoinAndSelect('post.author', 'author')
            .orderBy('post.createdAt', 'DESC');

        if (query?.search) {
            qb.andWhere('(post.title ILIKE :search OR category.name ILIKE :search)', {
                search: `%${query.search}%`,
            });
        }

        return qb.getMany();
    }

    async getPostById(id: string) {
        const post = await this.blogPostRepository.findOne({ where: { id }, relations: ['category', 'author'] });
        if (!post) throw new NotFoundException('Post not found');
        return post;
    }

    async getPublicPosts(query?: { search?: string; categoryId?: string }) {
        const qb = this.blogPostRepository.createQueryBuilder('post')
            .leftJoinAndSelect('post.category', 'category')
            .leftJoinAndSelect('post.author', 'author')
            .where('post.isPublished = :isPublished', { isPublished: true })
            .orderBy('post.publishedAt', 'DESC');

        if (query?.search) {
            qb.andWhere('(post.title ILIKE :search OR category.name ILIKE :search)', {
                search: `%${query.search}%`,
            });
        }
        if (query?.categoryId) {
            qb.andWhere('post.categoryId = :categoryId', { categoryId: query.categoryId });
        }

        return qb.getMany();
    }

    async getPublicPostBySlug(slug: string) {
        const post = await this.blogPostRepository.findOne({
            where: { slug, isPublished: true },
            relations: ['category', 'author']
        });
        if (!post) throw new NotFoundException('Post not found');
        return post;
    }

    async createPost(data: any) {
        const post = this.blogPostRepository.create({
            ...data,
            publishedAt: data.isPublished ? new Date() : null,
        });
        return this.blogPostRepository.save(post);
    }

    async updatePost(id: string, data: any) {
        const post = await this.getPostById(id);
        if (!post.isPublished && data.isPublished) {
            data.publishedAt = new Date();
        }
        Object.assign(post, data);
        return this.blogPostRepository.save(post);
    }

    async deletePost(id: string) {
        await this.blogPostRepository.delete(id);
        return { success: true };
    }
}
