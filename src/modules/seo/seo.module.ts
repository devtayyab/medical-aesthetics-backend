import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeoController } from './seo.controller';
import { Treatment } from '../clinics/entities/treatment.entity';
import { TreatmentCategory } from '../clinics/entities/treatment-category.entity';
import { BlogPost } from '../clinics/entities/blog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Treatment, TreatmentCategory, BlogPost])],
  controllers: [SeoController],
})
export class SeoModule {}

