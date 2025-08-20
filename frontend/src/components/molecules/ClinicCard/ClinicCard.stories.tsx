import type { Meta, StoryObj } from '@storybook/react';
import { ClinicCard } from './ClinicCard';
import type { Clinic } from '@/types';

const meta: Meta<typeof ClinicCard> = {
  title: 'Molecules/ClinicCard',
  component: ClinicCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleClinic: Clinic = {
  id: '1',
  name: 'Glamour Beauty Clinic',
  description: 'Premium beauty treatments in the heart of the city',
  address: {
    street: '123 Beauty Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
  },
  phone: '+1 (555) 123-4567',
  email: 'info@glamourbeauty.com',
  businessHours: {
    monday: { open: '09:00', close: '18:00', isOpen: true },
    tuesday: { open: '09:00', close: '18:00', isOpen: true },
    wednesday: { open: '09:00', close: '18:00', isOpen: true },
    thursday: { open: '09:00', close: '18:00', isOpen: true },
    friday: { open: '09:00', close: '18:00', isOpen: true },
    saturday: { open: '10:00', close: '16:00', isOpen: true },
    sunday: { open: '10:00', close: '16:00', isOpen: false },
  },
  isActive: true,
  ownerId: 'owner-1',
  images: ['https://images.pexels.com/photos/3985360/pexels-photo-3985360.jpeg?auto=compress&cs=tinysrgb&w=400'],
  rating: 4.8,
  reviewCount: 127,
  priceRange: '$50 - $200',
  distance: 2.3,
  services: [],
};

export const Default: Story = {
  args: {
    clinic: sampleClinic,
  },
};

export const WithoutRating: Story = {
  args: {
    clinic: {
      ...sampleClinic,
      rating: undefined,
      reviewCount: undefined,
    },
  },
};

export const WithoutDistance: Story = {
  args: {
    clinic: {
      ...sampleClinic,
      distance: undefined,
    },
  },
};

export const ClosedToday: Story = {
  args: {
    clinic: {
      ...sampleClinic,
      businessHours: {
        ...sampleClinic.businessHours,
        sunday: { open: '10:00', close: '16:00', isOpen: false },
      },
    },
  },
};

export const Grid: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', maxWidth: '1000px' }}>
      <ClinicCard clinic={sampleClinic} />
      <ClinicCard clinic={{ ...sampleClinic, id: '2', name: 'Serenity Spa', rating: 4.6, distance: 1.8 }} />
      <ClinicCard clinic={{ ...sampleClinic, id: '3', name: 'Elite Aesthetics', rating: 4.9, distance: 3.2, priceRange: '$80 - $300' }} />
    </div>
  ),
};