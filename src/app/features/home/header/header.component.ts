// Port of src/views/home/header.tsx
//
// Persistent top bar. Reads its copy straight from `homeContent` (brand,
// nav, meta) per this phase's data-layer convention. The slide-out mobile
// menu (`components/common/nav-menu.tsx` -> `NavMenuComponent`) is mounted
// as a sibling of this component at the page-assembly level in the
// reference (see `views/home.tsx`), not nested inside the header — this
// component only opens it via `NavMenuService.openMenu()`.
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { InViewDirective } from '../../../core/directives/in-view.directive';
import { HoverDirective } from '../../../core/directives/hover.directive';
import { LogoMarkComponent } from '../../../shared/ui/logo-mark/logo-mark.component';
import { IconGridComponent } from '../../../shared/ui/icons/icon-grid.component';
import { ClockService } from '../../../core/services/clock.service';
import { IntroService } from '../../../core/services/intro.service';
import { NavMenuService } from '../../../core/services/nav-menu.service';
import { RequestModalService } from '../../../core/services/request-modal.service';
import { ScrollService } from '../../../core/services/scroll.service';
import { homeContent } from '../../../data/home-content';
import type { StyleValues } from '../../../core/animation/spring-style-runner';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [InViewDirective, HoverDirective, LogoMarkComponent, IconGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  protected readonly intro = inject(IntroService);
  protected readonly clock = inject(ClockService);
  protected readonly navMenu = inject(NavMenuService);
  private readonly requestModal = inject(RequestModalService);
  private readonly scroll = inject(ScrollService);

  protected readonly brand = homeContent.brand;
  protected readonly nav = homeContent.nav;
  protected readonly meta = homeContent.meta;

  protected readonly headerFrom: StyleValues = { opacity: 0, transform: 'translateY(-14px)' };
  protected readonly headerTo: StyleValues = { opacity: 1, transform: 'translateY(0px)' };
  protected readonly headerConfig = { tension: 210, friction: 26 };

  protected readonly brandHoverFrom: StyleValues = { transform: 'scale(1)' };
  protected readonly brandHoverTo: StyleValues = { transform: 'scale(1.04)' };
  protected readonly brandHoverConfig = { tension: 320, friction: 18 };

  protected readonly navHoverFrom: StyleValues = { transform: 'translateY(0px)', opacity: 0.8 };
  protected readonly navHoverTo: StyleValues = { transform: 'translateY(-2px)', opacity: 1 };
  protected readonly navHoverConfig = { tension: 320, friction: 22 };

  protected readonly menuHoverFrom: StyleValues = { transform: 'scale(1)' };
  protected readonly menuHoverTo: StyleValues = { transform: 'scale(1.05)' };
  protected readonly menuHoverConfig = { tension: 320, friction: 18 };

  protected scrollHome(): void {
    this.scroll.scrollTo('home');
  }

  protected handleNav(href: string): void {
    if (href === '#contact') {
      this.requestModal.openModal();
      return;
    }
    this.scroll.scrollTo(href.replace('#', ''));
  }

  protected openMenu(): void {
    this.navMenu.openMenu();
  }
}
