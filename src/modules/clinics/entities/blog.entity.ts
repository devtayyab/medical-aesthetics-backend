import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('blog_categories')
export class BlogCategory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    slug: string;

    @OneToMany(() => BlogPost, (post) => post.category)
    posts: BlogPost[];

    @CreateDateColumn()
    createdAt: Date;
}

@Entity('blog_posts')
export class BlogPost {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    @Index({ unique: true })
    slug: string;

    @Column('text')
    content: string;

    @Column({ nullable: true })
    imageUrl: string;

    @Column({ default: false })
    isPublished: boolean;

    @Column({ nullable: true })
    scheduledAt: Date;

    @Column({ nullable: true })
    categoryId: string;

    @Column({ nullable: true })
    authorId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'authorId' })
    author: User;

    @ManyToOne(() => BlogCategory, (category) => category.posts)
    @JoinColumn({ name: 'categoryId' })
    category: BlogCategory;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    publishedAt: Date;
}
