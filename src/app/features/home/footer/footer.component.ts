// Port of src/views/home/footer.tsx
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { AnimatedVarTextComponent } from '../../../core/text/animated-var-text.component';
import { PillButtonComponent } from '../../../shared/ui/pill-button/pill-button.component';
import { AnimatedLinkComponent } from '../../../shared/ui/animated-link/animated-link.component';
import { LogoMarkComponent } from '../../../shared/ui/logo-mark/logo-mark.component';
import { RequestModalService } from '../../../core/services/request-modal.service';
import type { StyleValues } from '../../../core/animation/spring-style-runner';
import type { SpringPhysicsConfig } from '../../../core/animation/spring-physics';
import type { HomeContent } from '../../../data/home-content';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [AnimatedVarTextComponent, PillButtonComponent, AnimatedLinkComponent, LogoMarkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  readonly brand = input.required<string>();
  readonly footer = input.required<HomeContent['footer']>();

  private readonly requestModal = inject(RequestModalService);

  protected readonly headingLineIn = { y: '0%', opacity: 1 };
  protected readonly headingLineOut = { y: '100%', opacity: 0 };
  protected readonly headingLineConfig: SpringPhysicsConfig = {};

  protected readonly legalLinkFrom: StyleValues = { transform: 'translateX(0px)', opacity: 0.7 };
  protected readonly legalLinkTo: StyleValues = { transform: 'translateX(3px)', opacity: 1 };

  protected openModal(): void {
    this.requestModal.openModal();
  }
}
