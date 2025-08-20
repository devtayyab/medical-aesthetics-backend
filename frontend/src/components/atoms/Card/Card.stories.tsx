import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Atoms/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const SampleContent = () => (
  <div>
    <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>
      Card Title
    </h3>
    <p style={{ color: 'var(--color-gray-600)', lineHeight: 1.5 }}>
      This is some sample content inside the card. It demonstrates how the card
      component wraps and styles content.
    </p>
  </div>
);

export const Default: Story = {
  args: {
    children: <SampleContent />,
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: <SampleContent />,
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: <SampleContent />,
  },
};

export const Hoverable: Story = {
  args: {
    hoverable: true,
    children: <SampleContent />,
  },
};

export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: (
      <div>
        <img
          src="https://images.pexels.com/photos/3985360/pexels-photo-3985360.jpeg?auto=compress&cs=tinysrgb&w=400"
          alt="Spa treatment"
          style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '0.75rem 0.75rem 0 0' }}
        />
        <div style={{ padding: '1rem' }}>
          <SampleContent />
        </div>
      </div>
    ),
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', width: '600px' }}>
      <Card variant="default">
        <SampleContent />
      </Card>
      <Card variant="elevated">
        <SampleContent />
      </Card>
      <Card variant="outlined">
        <SampleContent />
      </Card>
    </div>
  ),
};