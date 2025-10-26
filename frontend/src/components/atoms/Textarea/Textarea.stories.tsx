import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Atoms/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    rows: {
      control: { type: 'number', min: 1, max: 10 },
    },
    required: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
    fullWidth: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your message...',
    rows: 4,
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Message',
    placeholder: 'Type your message here...',
    rows: 4,
  },
};

export const Required: Story = {
  args: {
    label: 'Required Field',
    placeholder: 'This field is required',
    required: true,
    rows: 3,
  },
};

export const WithError: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter a detailed description...',
    error: 'This field is required',
    required: true,
    rows: 4,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Notes',
    placeholder: 'Add any additional notes...',
    helperText: 'Maximum 500 characters',
    rows: 3,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Field',
    placeholder: 'This field is disabled',
    disabled: true,
    rows: 3,
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Full Width Textarea',
    placeholder: 'This textarea spans the full width',
    fullWidth: true,
    rows: 5,
  },
};

export const DifferentSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '400px' }}>
      <Textarea label="Small (2 rows)" placeholder="Small textarea" rows={2} />
      <Textarea label="Medium (4 rows)" placeholder="Medium textarea" rows={4} />
      <Textarea label="Large (6 rows)" placeholder="Large textarea" rows={6} />
    </div>
  ),
};

export const Playground: Story = {
  args: {
    label: 'Custom Textarea',
    placeholder: 'Customize this textarea in the controls panel',
    helperText: 'You can modify all props using the controls',
    rows: 4,
  },
};
