import { render, screen } from '@testing-library/react';
import { GlassCard } from '@/mcp-widgets/components/GlassCard';

describe('GlassCard', () => {
  it('renders children correctly', () => {
    render(<GlassCard>Test Content</GlassCard>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies primary variant classes by default', () => {
    const { container } = render(<GlassCard>Test</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('bg-gradient-to-br');
    expect(card.className).toContain('from-white/10');
  });

  it('applies danger variant classes', () => {
    const { container } = render(<GlassCard variant="danger">Test</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('from-red-900/20');
    expect(card.className).toContain('border-red-500/30');
  });

  it('applies success variant classes', () => {
    const { container } = render(<GlassCard variant="success">Test</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('from-green-900/20');
    expect(card.className).toContain('border-green-500/30');
  });

  it('applies info variant classes', () => {
    const { container } = render(<GlassCard variant="info">Test</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('from-blue-900/20');
    expect(card.className).toContain('border-blue-500/30');
  });

  it('applies warning variant classes', () => {
    const { container } = render(<GlassCard variant="warning">Test</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('from-yellow-900/20');
    expect(card.className).toContain('border-yellow-500/30');
  });

  it('applies interactive ripple effect', () => {
    const { container } = render(<GlassCard interactive>Test</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('ripple');
  });

  it('does not apply ripple when interactive is false', () => {
    const { container } = render(<GlassCard interactive={false}>Test</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('ripple');
  });

  it('applies hover classes when hover is true', () => {
    const { container } = render(<GlassCard hover variant="primary">Test</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('hover:border-cod-orange');
  });

  it('does not apply hover classes when hover is false', () => {
    const { container } = render(<GlassCard hover={false} variant="primary">Test</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('hover:');
  });

  it('merges custom className prop', () => {
    const { container } = render(
      <GlassCard className="custom-class">Test</GlassCard>
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('custom-class');
    expect(card.className).toContain('rounded-xl');
  });

  it('forwards Framer Motion props', () => {
    const { container } = render(
      <GlassCard
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.05 }}
      >
        Test
      </GlassCard>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('supports all variant types', () => {
    const variants = ['primary', 'secondary', 'accent', 'danger', 'success', 'info', 'warning'] as const;

    variants.forEach((variant) => {
      const { container } = render(<GlassCard variant={variant}>Test {variant}</GlassCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('bg-gradient-to-br');
      expect(card.className).toContain('backdrop-blur');
    });
  });

  it('applies correct base styles to all variants', () => {
    const { container } = render(<GlassCard>Test</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('rounded-xl');
    expect(card.className).toContain('p-6');
    expect(card.className).toContain('transition-all');
    expect(card.className).toContain('duration-300');
  });
});
