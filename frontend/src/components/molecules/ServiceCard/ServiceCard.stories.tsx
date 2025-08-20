import type { Meta, StoryObj } from '@storybook/react';
import { ServiceCard } from './ServiceCard';
import type { Service } from '@/types';

const meta: Meta<typeof ServiceCard> = {
  title: 'Molecules/ServiceCard',
  component: ServiceCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleService: Service = {
  id: '1',
  name: 'Deep Cleansing Facial',
  description: 'A comprehensive facial treatment that deeply cleanses pores, removes impurities, and leaves your skin refreshed and glowing.',
  price: 85,
  durationMinutes: 60,
  category: 'Facial',
  isActive: true,
  clinicId: 'clinic-1',
};

export const Default: Story = {
  args: {
    service: sampleService,
  },
};

export const Selected: Story = {
  args: {
    service: sampleService,
    isSelected: true,
  },
};

export const LongDuration: Story = {
  args: {
    service: {
      ...sampleService,
      name: 'Full Body Massage',
      description: 'Relaxing full body massage to relieve tension and stress.',
      price: 120,
      durationMinutes: 90,
      category: 'Massage',
    },
  },
};

export const ShortDuration: Story = {
  args: {
    service: {
      ...sampleService,
      name: 'Express Manicure',
      description: 'Quick and professional manicure service.',
      price: 35,
      durationMinutes: 30,
      category: 'Nails',
    },
  },
};

export const NoCategory: Story = {
  args: {
    service: {
      ...sampleService,
      category: '',
    },
  },
};

export const ServiceList: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
      <ServiceCard service={sampleService} />
      <ServiceCard 
        service={{
          ...sampleService,
          id: '2',
          name: 'Anti-Aging Treatment',
          price: 150,
          durationMinutes: 75,
          category: 'Anti-Aging',
        }}
        isSelected
      />
      <ServiceCard 
        service={{
          ...sampleService,
          id: '3',
          name: 'Eyebrow Threading',
          price: 25,
          durationMinutes: 15,
          category: 'Eyebrows',
        }}
      />
    </div>
  ),
};