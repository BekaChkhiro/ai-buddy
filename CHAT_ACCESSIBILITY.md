# Chat Interface - Accessibility Features

## Keyboard Shortcuts

### Global Shortcuts
- `Ctrl/Cmd + N` - Create new conversation
- `Ctrl/Cmd + K` - Focus search/conversation list
- `/` - Focus message input
- `Escape` - Close dialogs / Clear input / Blur focused element
- `Ctrl/Cmd + Shift + S` - Toggle sidebar

### Message Actions
- `Ctrl/Cmd + R` - Regenerate last assistant message
- `Enter` - Send message (in input field)
- `Shift + Enter` - New line (in input field)

### Navigation
- `Tab` - Navigate between interactive elements
- `Shift + Tab` - Navigate backward
- `Arrow Up/Down` - Navigate through conversation list
- `Enter` - Select conversation (when focused)

## ARIA Labels and Semantic HTML

### Message Components
- Each message has proper role attributes (`role="article"`)
- Message sender identified with `aria-label`
- Timestamps use `time` element with `datetime` attribute
- Code blocks have `aria-label` indicating language

### Interactive Elements
- All buttons have descriptive `aria-label` or visible text
- Icon-only buttons include text alternatives
- Loading states use `aria-live="polite"` regions
- Error messages use `aria-live="assertive"`

### Forms and Inputs
- Message input has associated label
- File picker has descriptive label
- Context file chips are keyboard accessible
- Form validation errors announced to screen readers

### Navigation and Structure
- Proper heading hierarchy (h1, h2, h3)
- Landmark regions (main, aside, navigation)
- Skip to main content link
- Breadcrumb navigation with `aria-label`

## Screen Reader Support

### Message Reading
- Messages read in chronological order
- Sender (You/Assistant) announced before content
- Timestamps read in natural language
- Code blocks announced with language identifier

### Streaming Messages
- Streaming status announced (`aria-live="polite"`)
- "Thinking..." state conveyed to screen readers
- Stop button clearly labeled and focusable

### Conversation List
- Current conversation marked with `aria-current="page"`
- Conversation count announced
- Empty state has descriptive text

## Focus Management

### Focus Indicators
- All interactive elements have visible focus rings
- Focus rings use high contrast colors
- Custom focus styles match design system
- Focus order follows visual layout

### Focus Trapping
- Dialogs trap focus within modal
- Escape key closes modals and returns focus
- Tab cycles through dialog elements only

### Auto-Focus Behavior
- New conversation focuses message input
- Switching conversations maintains context
- Error dialogs focus on primary action
- Search focuses input on open

## Color and Contrast

### Text Contrast
- All text meets WCAG AA standards (4.5:1)
- Important text meets AAA standards (7:1)
- Code syntax highlighting maintains readability
- Placeholder text uses sufficient contrast

### UI Elements
- Buttons have clear visual states (hover, active, focus, disabled)
- Icons paired with text labels where possible
- Color not used as sole indicator
- Dark mode maintains contrast ratios

### Message Differentiation
- User and assistant messages visually distinct
- Background colors accessible in both themes
- Active conversation clearly marked
- Streaming indicator uses motion and color

## Motion and Animation

### Reduced Motion
- Respects `prefers-reduced-motion` setting
- Essential animations only
- Smooth scroll can be disabled
- Auto-scroll respects user preference

### Animation Types
- Fade in/out for messages
- Smooth scroll for new messages
- Pulse effect for streaming indicator
- Transition duration: 150-300ms

## Mobile Accessibility

### Touch Targets
- All interactive elements minimum 44x44px
- Adequate spacing between touch targets
- Swipe gestures have alternatives
- Pinch-to-zoom enabled

### Mobile Navigation
- Hamburger menu for sidebar
- Bottom sheet for quick actions
- One-handed operation support
- Landscape mode supported

## Testing

### Manual Testing Checklist
- [ ] Navigate entire interface with keyboard only
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify color contrast with tools
- [ ] Test with browser zoom at 200%
- [ ] Verify focus indicators visible
- [ ] Test with reduced motion enabled
- [ ] Check mobile touch targets
- [ ] Validate HTML with accessibility tools

### Automated Testing
- ESLint plugin for a11y rules
- Axe DevTools for runtime checks
- Lighthouse accessibility audit
- Color contrast validation

## Implementation Details

### Component-Level Accessibility

#### MessageItem
```typescript
<article
  role="article"
  aria-label={`Message from ${isUser ? 'you' : 'assistant'}`}
>
  <time dateTime={message.createdAt}>
    {formatTime(message.createdAt)}
  </time>
  <div className="prose" aria-live="off">
    {/* Message content */}
  </div>
</article>
```

#### ChatInput
```typescript
<div role="region" aria-label="Message input">
  <label htmlFor="message-input" className="sr-only">
    Type your message
  </label>
  <textarea
    id="message-input"
    aria-label="Message input"
    aria-multiline="true"
    aria-required="true"
  />
</div>
```

#### StreamingMessage
```typescript
<div
  role="status"
  aria-live="polite"
  aria-label="Assistant is responding"
>
  <div aria-busy="true">
    {content}
  </div>
</div>
```

## Best Practices Implemented

1. **Semantic HTML**: Use proper HTML5 elements
2. **Keyboard Navigation**: All features keyboard accessible
3. **Screen Reader Support**: Proper ARIA labels and live regions
4. **Focus Management**: Clear focus indicators and logical order
5. **Color Independence**: Don't rely solely on color
6. **Motion Sensitivity**: Respect user preferences
7. **Touch-Friendly**: Adequate target sizes
8. **Error Handling**: Clear, accessible error messages
9. **Loading States**: Proper loading indicators
10. **Testing**: Regular accessibility audits

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Inclusive Components](https://inclusive-components.design/)
