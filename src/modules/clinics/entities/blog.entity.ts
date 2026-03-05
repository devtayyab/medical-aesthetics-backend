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

    @Column({ default: true })
    isPublished: boolean;

    @Column({ nullable: true })
    categoryId: string;

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
