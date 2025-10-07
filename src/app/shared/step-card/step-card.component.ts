import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, computed, input, output } from '@angular/core';

type FooterPlacement = 'inside' | 'outside';
type StepCardSize = 'sm' | 'md' | 'lg' | 'xl' | 'auto';

@Component({
  selector: 'app-step-card',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './step-card.component.html'
})
export class StepCardComponent {
  currentStep   = input.required<number>();
  totalSteps    = input.required<number>();
  showProgress  = input(true);

  headerText    = input<string | undefined>(undefined);
  showHeader    = input(true);
  title         = input<string | undefined>(undefined);

  showFooter        = input(true);
  footerPlacement   = input<FooterPlacement>('inside');
  ariaLabel         = input<string>('Paso de proceso');

  cardSize = input<StepCardSize>('md', { alias: 'size' });
  maxWidth = input<string>('528px');
  fullBleed = input<boolean>(false);
  containerClass = input<string>('');
  cardClass = input<string>('');

  action = output<string>();

  private readonly sizeMap: Record<Exclude<StepCardSize, 'auto'>, string> = {
    sm: '480px',
    md: '528px',
    lg: '680px',
    xl: '820px'
  };

  private normalizeSize = (v: StepCardSize | string | null | undefined): StepCardSize => {
    const s = String(v ?? '').trim().toLowerCase() as StepCardSize;
    return (['sm','md','lg','xl','auto'] as const).includes(s) ? s : 'md';
  };

  computedWidth = computed(() => {
    if (this.fullBleed()) return '100%';
    const s = this.normalizeSize(this.cardSize());
    if (s === 'auto') return '100%';
    return this.sizeMap[s];
  });

  computedMaxWidth = computed(() => {
    if (this.fullBleed()) return 'none';
    const s = this.normalizeSize(this.cardSize());
    if (s === 'auto') return this.maxWidth();
    return this.sizeMap[s];
  });

  steps = computed(() => {
    const total = Math.max(1, this.totalSteps() ?? 1);
    const curr  = Math.min(Math.max(1, this.currentStep() ?? 1), total);
    return Array.from({ length: total }, (_, i) => i < curr);
  });

  stepPadded = () => String(this.currentStep()).padStart(2, '0');
}
