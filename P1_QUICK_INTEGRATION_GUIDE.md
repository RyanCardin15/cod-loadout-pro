# P1 Quick Integration Guide

**Quick reference for applying P1 improvements to existing widgets**

---

## Import Statements (Add to top of widget files)

```tsx
// Skeleton loaders
import {
  LoadoutCardSkeleton,
  CounterSuggestionsSkeleton,
  WeaponListSkeleton,
  MetaTierListSkeleton,
} from '@/components/shared/SkeletonLoader';

// Tooltips
import {
  StatTooltip,
  TierTooltip,
  AttachmentTooltip,
  EffectivenessTooltip,
  InfoTooltip,
} from '@/components/shared/Tooltip';

// Copy buttons
import {
  CopyButton,
  CopyWeaponButton,
  CopyLoadoutCodeButton,
} from '@/components/shared/CopyButton';

// Error handling
import { ErrorCard } from '@/components/shared/ErrorCard';

// Hooks
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { useClipboard } from '@/hooks/useClipboard';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';
```

---

## 1. Skeleton Loading (Priority 1)

### Before:
```tsx
if (!data) {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-cod-gray rounded w-3/4 mb-4"></div>
      <div className="h-32 bg-cod-gray rounded"></div>
    </div>
  );
}
```

### After:
```tsx
if (!data) {
  return <LoadoutCardSkeleton />; // Or appropriate skeleton
}
```

**Available Skeletons:**
- `LoadoutCardSkeleton`
- `CounterSuggestionsSkeleton`
- `WeaponListSkeleton`
- `MetaTierListSkeleton`

---

## 2. Tooltips (Priority 2)

### Stat Bars with Tooltips:
```tsx
<StatTooltip
  label="Damage"
  value={85}
  description="Damage output per shot"
>
  <div className="cursor-help">
    {/* Your stat bar content */}
  </div>
</StatTooltip>
```

### Tier Badges with Tooltips:
```tsx
<TierTooltip
  tier="S"
  description="Top Tier - Dominates the meta"
>
  <span className="tier-S cursor-help">S-TIER</span>
</TierTooltip>
```

### Attachments with Tooltips:
```tsx
<AttachmentTooltip
  name="Monolithic Suppressor"
  slot="Muzzle"
  effect="Improves range and sound suppression"
>
  <div className="cursor-help">
    {attachment.name}
  </div>
</AttachmentTooltip>
```

### Effectiveness Ratings:
```tsx
<EffectivenessTooltip
  percentage={85}
  description="High effectiveness against this weapon"
>
  <span className="cursor-help">{effectiveness}%</span>
</EffectivenessTooltip>
```

---

## 3. Micro-Interactions (Priority 3)

### Setup:
```tsx
const { handleInteraction, showSuccess, showError, buttonPress } = useMicroInteractions();
```

### Button with Feedback:
```tsx
<motion.button
  onClick={(e) => {
    handleInteraction(e); // Haptic + visual feedback
    performAction();
    showSuccess('Action completed!');
  }}
  whileTap={{ scale: 0.95 }}
  className="ripple" // CSS ripple effect
>
  Click Me
</motion.button>
```

### Card with Ripple:
```tsx
<motion.div
  className="card ripple"
  whileHover={{ scale: 1.02, y: -5 }}
  whileTap={{ scale: 0.98 }}
  tabIndex={0}
>
  {/* Card content */}
</motion.div>
```

---

## 4. Gradient Text (Priority 4)

### Main Headers:
```tsx
<h1 className="gradient-text-premium">
  LOADOUT BUILDER
</h1>
```

### Tier Labels:
```tsx
<span className="gradient-text-tier-s">S-TIER</span>
<span className="gradient-text-tier-a">A-TIER</span>
```

### TTK Numbers:
```tsx
<span className="gradient-text-ttk">
  {weapon.ttk}ms
</span>
```

### Effectiveness:
```tsx
<span className="gradient-text-effectiveness">
  {effectiveness}%
</span>
```

**Available Classes:**
- `.gradient-text` (original)
- `.gradient-text-premium` (animated)
- `.gradient-text-tier-s`
- `.gradient-text-tier-a`
- `.gradient-text-ttk`
- `.gradient-text-effectiveness`

---

## 5. Copy Buttons (Priority 5)

### Icon Only (Compact):
```tsx
<CopyWeaponButton weaponName="MCW" />
```

### Full Button:
```tsx
<CopyButton
  text="Loadout Code: ABC123"
  label="Copy Code"
  variant="button"
/>
```

### Inline Text:
```tsx
<CopyButton
  text={weaponName}
  variant="inline"
  showLabel
/>
```

### With Header:
```tsx
<div className="flex items-center justify-between">
  <h1>{weaponName}</h1>
  <CopyWeaponButton weaponName={weaponName} />
</div>
```

---

## 6. Enhanced Error States (Priority 6)

### Connection Error:
```tsx
if (error?.type === 'FIREBASE_CONNECTION_ERROR') {
  return (
    <ErrorCard
      type="FIREBASE_CONNECTION_ERROR"
      title="Connection Error"
      message={error.message}
      onRetry={() => refetch()}
      retryLabel="Reconnect"
    />
  );
}
```

### Not Found Error:
```tsx
if (error?.type === 'WEAPON_NOT_FOUND') {
  return (
    <ErrorCard
      type="WEAPON_NOT_FOUND"
      title="Weapon Not Found"
      message={error.message}
      suggestions={error.suggestions}
    />
  );
}
```

### Unknown Error:
```tsx
if (error) {
  return (
    <ErrorCard
      type="UNKNOWN_ERROR"
      title="Something Went Wrong"
      message={error.message}
      onRetry={() => window.location.reload()}
      details={error.stack} // Expandable technical details
    />
  );
}
```

---

## 7. Keyboard Navigation (Priority 7)

### List Navigation:
```tsx
const { getItemProps } = useKeyboardNav(items.length, {
  orientation: 'vertical',
  loop: true,
  onSelect: (index) => selectItem(items[index]),
  onEscape: () => closeList(),
});

return (
  <div>
    {items.map((item, index) => (
      <div
        key={item.id}
        {...getItemProps(index)}
        className="focus-ring cursor-pointer"
      >
        {item.name}
      </div>
    ))}
  </div>
);
```

### Grid Navigation:
```tsx
const { getItemProps } = useKeyboardNav(items.length, {
  orientation: 'both', // Horizontal + vertical
  loop: false,
});
```

### Add ARIA Labels:
```tsx
<div
  role="article"
  aria-label={`Weapon: ${weapon.name}`}
  tabIndex={0}
  className="focus-ring"
>
  {/* Content */}
</div>
```

---

## Complete Widget Upgrade Template

```tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { /* icons */ } from 'lucide-react';
import { /* types */ } from './types';

// Import P1 components
import { LoadoutCardSkeleton } from '@/components/shared/SkeletonLoader';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { StatTooltip, TierTooltip } from '@/components/shared/Tooltip';
import { CopyWeaponButton } from '@/components/shared/CopyButton';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';

const Widget: React.FC<Props> = ({ toolOutput }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showSuccess, handleInteraction } = useMicroInteractions();

  useEffect(() => {
    // ... data loading logic
    setIsLoading(false);
  }, [toolOutput]);

  // Skeleton loading
  if (isLoading || !data) {
    return <LoadoutCardSkeleton />;
  }

  // Error handling
  if (data.error) {
    return (
      <ErrorCard
        type={data.error.type}
        title="Error Title"
        message={data.error.message}
        onRetry={() => refetch()}
        suggestions={data.error.suggestions}
      />
    );
  }

  return (
    <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
      {/* Header with gradient text and copy button */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <h1 className="gradient-text-premium">
            {data.title}
          </h1>
          <CopyWeaponButton weaponName={data.weaponName} />
        </div>
      </motion.div>

      {/* Content with tooltips and micro-interactions */}
      <motion.div
        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-xl p-6 hover:border-cod-orange transition-all duration-300 ripple"
        whileHover={{ scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
        tabIndex={0}
        role="article"
        aria-label={data.title}
      >
        {/* Stats with tooltips */}
        {data.stats && (
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(data.stats).map(([key, value]) => (
              <StatTooltip
                key={key}
                label={key}
                value={value}
                description={`${key} performance metric`}
              >
                <div className="cursor-help">
                  {/* Stat display */}
                </div>
              </StatTooltip>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Widget;
```

---

## Styling Checklist

### Add to Interactive Elements:
- `className="ripple"` - Ripple effect on click
- `whileTap={{ scale: 0.95 }}` - Scale down on tap
- `whileHover={{ scale: 1.02 }}` - Scale up on hover
- `tabIndex={0}` - Make keyboard accessible
- `className="focus-ring"` - Visible focus indicator
- `className="cursor-help"` - Cursor change for tooltips
- `className="cursor-pointer"` - Cursor for clickable items

### Add to Headers:
- `className="gradient-text-premium"` - Animated gradient
- `text-shadow-glow` - Glow effect on emphasis

### Add to Numbers:
- `className="gradient-text-ttk"` - TTK highlights
- `className="gradient-text-effectiveness"` - Effectiveness highlights

### Add to Tier Badges:
- `className="gradient-text-tier-s"` - S-Tier
- `className="gradient-text-tier-a"` - A-Tier

---

## Accessibility Checklist

- [ ] Add `role` attributes (`article`, `list`, `listitem`, etc.)
- [ ] Add `aria-label` to interactive elements
- [ ] Add `aria-live` to dynamic content
- [ ] Add `tabIndex={0}` to focusable elements
- [ ] Add `.focus-ring` class to all interactive elements
- [ ] Ensure color contrast meets 4.5:1 ratio
- [ ] Test keyboard navigation (Tab, Arrow keys, Enter, Escape)
- [ ] Test screen reader compatibility
- [ ] Ensure touch targets are 44x44px minimum

---

## Testing Checklist

Per widget after integration:

- [ ] Skeleton loads smoothly without flicker
- [ ] Tooltips appear on hover (desktop) and long-press (mobile)
- [ ] Gradient text displays and animates correctly
- [ ] Copy buttons work and show success toast
- [ ] Error states render with retry functionality
- [ ] Haptic feedback works on mobile
- [ ] Ripple effects trigger on click
- [ ] Keyboard navigation works (Tab, arrows, Enter, Escape)
- [ ] Focus indicators are visible
- [ ] Screen reader announces content correctly
- [ ] Build passes without TypeScript errors
- [ ] No console warnings or errors
- [ ] Performance remains smooth (60fps animations)

---

## Common Patterns

### Loading State:
```tsx
if (isLoading) return <WidgetSkeleton />;
```

### Error State:
```tsx
if (error) return <ErrorCard {...errorProps} />;
```

### Header with Copy:
```tsx
<div className="flex items-center justify-between">
  <h1 className="gradient-text-premium">{title}</h1>
  <CopyWeaponButton weaponName={weaponName} />
</div>
```

### Interactive Card:
```tsx
<motion.div
  className="card ripple focus-ring"
  whileHover={{ scale: 1.02, y: -5 }}
  whileTap={{ scale: 0.98 }}
  tabIndex={0}
  role="article"
>
  {content}
</motion.div>
```

### Stat with Tooltip:
```tsx
<StatTooltip label="Damage" value={85} description="Damage per shot">
  <div className="stat-bar cursor-help">
    {/* Stat content */}
  </div>
</StatTooltip>
```

---

## Performance Tips

- Use `React.memo()` for expensive components
- Lazy-load tooltips (already handled by Radix)
- Debounce rapid micro-interactions
- Use CSS animations over JS when possible
- Keep haptic vibrations short (<50ms)
- Limit simultaneous animations

---

## Mobile Considerations

- Touch targets minimum 44x44px
- Haptic feedback for all interactions
- Long-press for tooltips
- Swipe gestures for navigation
- Reduced motion support (prefers-reduced-motion)
- Larger tap areas for small buttons

---

*Quick Reference - P1 UI Improvements*
*Generated by Claude Code - Precision Engineer*
